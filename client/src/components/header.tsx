import { Link } from "wouter";
import { TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StockSearch } from "./stock-search";
import { ThemeToggle } from "./theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { getUserId } from "@/lib/userId";
import type { WatchlistItem } from "@shared/schema";

export function Header() {
  const userId = getUserId();
  
  const { data: watchlist } = useQuery<WatchlistItem[]>({
    queryKey: ['/api/watchlist', userId],
    queryFn: async () => {
      const res = await fetch(`/api/watchlist/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch watchlist");
      return res.json();
    },
  });

  const watchlistCount = watchlist?.length ?? 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl" data-testid="link-home">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline">StockLens</span>
        </Link>

        <div className="flex-1 max-w-md hidden md:block">
          <StockSearch />
        </div>

        <div className="flex items-center gap-2">
          <Link href="/watchlist">
            <Button variant="ghost" className="gap-2 relative" data-testid="link-watchlist">
              <Star className="h-5 w-5" />
              <span className="hidden sm:inline">Watchlist</span>
              {watchlistCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="h-5 min-w-5 px-1.5 text-xs"
                  data-testid="text-watchlist-count"
                >
                  {watchlistCount}
                </Badge>
              )}
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
      
      <div className="container mx-auto px-4 pb-3 md:hidden">
        <StockSearch />
      </div>
    </header>
  );
}
