import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getUserId } from "@/lib/userId";
import { cn } from "@/lib/utils";
import type { WatchlistItem, StockDetail } from "@shared/schema";

interface WatchlistTableProps {
  watchlist: WatchlistItem[];
}

function formatMarketCap(value: number | null): string {
  if (!value) return "-";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

const zacksRankColors: Record<number, string> = {
  1: "bg-green-500",
  2: "bg-green-400",
  3: "bg-yellow-500",
  4: "bg-orange-500",
  5: "bg-red-500",
};

function WatchlistTableRow({ symbol }: { symbol: string }) {
  const userId = getUserId();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<StockDetail>({
    queryKey: ['/api/stocks', symbol],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch stock details");
      return res.json();
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/watchlist/${userId}/${symbol}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist', userId] });
      toast({
        title: "Removed from watchlist",
        description: `${symbol} has been removed from your watchlist.`,
      });
    },
  });

  if (isLoading) {
    return (
      <TableRow>
        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
        <TableCell className="text-center"><Skeleton className="h-6 w-6 mx-auto rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
      </TableRow>
    );
  }

  const isPositive = (data?.quote.change ?? 0) >= 0;

  return (
    <TableRow data-testid={`row-watchlist-${symbol}`}>
      <TableCell>
        <Link href={`/stock/${symbol}`}>
          <span className="font-mono font-bold hover:text-primary cursor-pointer" data-testid={`link-table-${symbol}`}>
            {symbol}
          </span>
        </Link>
      </TableCell>
      <TableCell className="max-w-[200px] truncate text-muted-foreground">
        {data?.quote.name || "-"}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">
        ${data?.quote.price.toFixed(2) || "-"}
      </TableCell>
      <TableCell className="text-right">
        <span className={cn(
          "flex items-center justify-end gap-1 font-mono tabular-nums",
          isPositive ? "text-green-500" : "text-red-500"
        )}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isPositive ? "+" : ""}{data?.quote.changePercent.toFixed(2)}%
        </span>
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">
        {data?.metrics.peRatio?.toFixed(2) || "-"}
      </TableCell>
      <TableCell className="text-right">
        {formatMarketCap(data?.metrics.marketCap ?? null)}
      </TableCell>
      <TableCell className="text-center">
        {data?.zacksRating ? (
          <Badge 
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center p-0 text-white font-bold",
              zacksRankColors[data.zacksRating.rank] || "bg-gray-500"
            )}
            data-testid={`badge-zacks-${symbol}`}
          >
            {data.zacksRating.rank}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeMutation.mutate()}
          disabled={removeMutation.isPending}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          data-testid={`button-remove-table-${symbol}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function WatchlistTable({ watchlist }: WatchlistTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Symbol</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right w-[100px]">Price</TableHead>
            <TableHead className="text-right w-[120px]">Change</TableHead>
            <TableHead className="text-right w-[80px]">P/E</TableHead>
            <TableHead className="text-right w-[100px]">Mkt Cap</TableHead>
            <TableHead className="text-center w-[80px]">Zacks</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {watchlist.map((item) => (
            <WatchlistTableRow key={item.id} symbol={item.symbol} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
