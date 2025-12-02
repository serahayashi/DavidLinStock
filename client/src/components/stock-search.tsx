import { useState, useRef, useEffect } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { StockSearchResult } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StockSearchProps {
  className?: string;
  size?: "default" | "large";
  placeholder?: string;
  autoFocus?: boolean;
}

export function StockSearch({ 
  className, 
  size = "default",
  placeholder = "Search stocks by ticker...",
  autoFocus = false
}: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery<StockSearchResult[]>({
    queryKey: ['/api/stocks/search', query],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: query.length >= 1,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (symbol: string) => {
    setQuery("");
    setIsOpen(false);
    setLocation(`/stock/${symbol}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results && results.length > 0) {
      handleSelect(results[0].symbol);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "large" ? "h-5 w-5" : "h-4 w-4"
        )} />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value.toUpperCase());
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          className={cn(
            "pl-10 pr-10 font-mono",
            size === "large" && "h-14 text-lg rounded-xl"
          )}
          data-testid="input-stock-search"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-clear-search"
          >
            <X className={cn(size === "large" ? "h-5 w-5" : "h-4 w-4")} />
          </button>
        )}
      </div>

      {isOpen && query.length >= 1 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-popover border border-popover-border rounded-lg shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Searching...
              </div>
            </div>
          ) : results && results.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((result) => (
                <li key={result.symbol}>
                  <button
                    onClick={() => handleSelect(result.symbol)}
                    className="w-full px-4 py-3 text-left hover-elevate flex items-center gap-3 border-b border-border last:border-b-0"
                    data-testid={`search-result-${result.symbol}`}
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-semibold text-foreground">
                        {result.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {result.name}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      {result.type}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center">
              <div className="text-muted-foreground mb-2">
                No results found for "{query}"
              </div>
              <div className="text-sm text-muted-foreground">
                Try searching for a stock ticker like AAPL, TSLA, or MSFT
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
