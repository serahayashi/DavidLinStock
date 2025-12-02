import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getUserId } from "@/lib/userId";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PriceChange } from "./price-change";
import type { StockQuote } from "@shared/schema";

interface WatchlistCardProps {
  symbol: string;
}

export function WatchlistCard({ symbol }: WatchlistCardProps) {
  const { toast } = useToast();
  const userId = getUserId();

  const { data: quote, isLoading } = useQuery<StockQuote>({
    queryKey: ['/api/stocks', symbol, 'quote'],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${symbol}/quote`);
      if (!res.ok) throw new Error("Failed to fetch quote");
      return res.json();
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/watchlist/${userId}/${symbol}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist', userId] });
      toast({
        title: "Removed from Watchlist",
        description: `${symbol} has been removed from your watchlist.`,
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="overflow-visible hover-elevate active-elevate-2">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="flex items-end justify-between gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quote) {
    return (
      <Card className="overflow-visible">
        <CardContent className="p-4">
          <div className="text-center py-4 text-muted-foreground">
            Failed to load {symbol}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = quote.change >= 0;

  return (
    <Card className="overflow-visible hover-elevate active-elevate-2 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <Link href={`/stock/${symbol}`} className="flex-1">
            <div className="font-mono text-lg font-bold" data-testid={`text-symbol-${symbol}`}>
              {symbol}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {quote.name}
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              removeMutation.mutate();
            }}
            disabled={removeMutation.isPending}
            className="visibility-hidden group-hover:visible h-8 w-8 text-muted-foreground hover:text-destructive"
            data-testid={`button-remove-${symbol}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Link href={`/stock/${symbol}`}>
          <div className="flex items-end justify-between gap-4">
            <div className="text-2xl font-bold tabular-nums font-mono" data-testid={`text-price-${symbol}`}>
              ${quote.price.toFixed(2)}
            </div>
            <PriceChange change={quote.change} changePercent={quote.changePercent} size="sm" />
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

export function WatchlistCardSkeleton() {
  return (
    <Card className="overflow-visible">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="flex items-end justify-between gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
