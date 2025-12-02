import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getUserId } from "@/lib/userId";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { WatchlistItem } from "@shared/schema";

interface WatchlistButtonProps {
  symbol: string;
  variant?: "default" | "icon";
  className?: string;
}

export function WatchlistButton({ symbol, variant = "default", className }: WatchlistButtonProps) {
  const { toast } = useToast();
  const userId = getUserId();

  const { data: watchlist } = useQuery<WatchlistItem[]>({
    queryKey: ['/api/watchlist', userId],
    queryFn: async () => {
      const res = await fetch(`/api/watchlist/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch watchlist");
      return res.json();
    },
  });

  const isInWatchlist = watchlist?.some(item => item.symbol === symbol) ?? false;

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/watchlist/${userId}`, { symbol }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist', userId] });
      toast({
        title: "Added to Watchlist",
        description: `${symbol} has been added to your watchlist.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist.",
        variant: "destructive",
      });
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove stock from watchlist.",
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    if (isInWatchlist) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  const isPending = addMutation.isPending || removeMutation.isPending;

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "transition-colors",
          isInWatchlist && "text-yellow-500 hover:text-yellow-600",
          className
        )}
        data-testid="button-watchlist-toggle"
      >
        <Star className={cn("h-5 w-5", isInWatchlist && "fill-current")} />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant={isInWatchlist ? "outline" : "default"}
      className={cn(
        "gap-2",
        isInWatchlist && "border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950",
        className
      )}
      data-testid="button-watchlist-toggle"
    >
      <Star className={cn("h-4 w-4", isInWatchlist && "fill-current")} />
      {isPending ? "Updating..." : isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
    </Button>
  );
}
