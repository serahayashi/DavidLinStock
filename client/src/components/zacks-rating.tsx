import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ZacksRating } from "@shared/schema";

interface ZacksRatingProps {
  rating: ZacksRating | null;
  isLoading?: boolean;
}

const rankColors: Record<number, string> = {
  1: "bg-green-500 text-white",
  2: "bg-green-400 text-white",
  3: "bg-yellow-500 text-black",
  4: "bg-orange-500 text-white",
  5: "bg-red-500 text-white",
};

const rankLabels: Record<number, string> = {
  1: "Strong Buy",
  2: "Buy",
  3: "Hold",
  4: "Sell",
  5: "Strong Sell",
};

export function ZacksRatingDisplay({ rating, isLoading }: ZacksRatingProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Zacks Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!rating) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Zacks Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Zacks rating not available for this stock.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Zacks Rating</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div 
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-lg text-3xl font-bold",
              rankColors[rating.rank] || "bg-gray-500 text-white"
            )}
            data-testid="text-zacks-rank"
          >
            {rating.rank}
          </div>
          <div className="flex-1">
            <Badge 
              className={cn(
                "text-sm px-3 py-1",
                rankColors[rating.rank] || "bg-gray-500 text-white"
              )}
              data-testid="badge-zacks-rank-text"
            >
              {rating.rankText || rankLabels[rating.rank]}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Based on Zacks proprietary rating system
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-xs">
            <span className="text-green-500 font-medium">1 = Strong Buy</span>
            <span className="text-red-500 font-medium">5 = Strong Sell</span>
          </div>
          <div className="flex mt-2 h-2 rounded-full overflow-hidden">
            <div className="flex-1 bg-green-500" />
            <div className="flex-1 bg-green-400" />
            <div className="flex-1 bg-yellow-500" />
            <div className="flex-1 bg-orange-500" />
            <div className="flex-1 bg-red-500" />
          </div>
          <div className="relative mt-1">
            <div 
              className="absolute w-3 h-3 bg-foreground rounded-full transform -translate-x-1/2"
              style={{ left: `${((rating.rank - 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
