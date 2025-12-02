import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Star, ArrowLeft, LayoutGrid, Table as TableIcon, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { WatchlistCard, WatchlistCardSkeleton } from "@/components/watchlist-card";
import { WatchlistTable } from "@/components/watchlist-table";
import { StockSearch } from "@/components/stock-search";
import { getUserId } from "@/lib/userId";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { WatchlistItem } from "@shared/schema";

type ViewMode = "cards" | "table";

export default function WatchlistPage() {
  const userId = getUserId();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: watchlist, isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ['/api/watchlist', userId],
    queryFn: async () => {
      const res = await fetch(`/api/watchlist/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch watchlist");
      return res.json();
    },
  });

  const importMutation = useMutation({
    mutationFn: async (xml: string) => {
      const res = await apiRequest("POST", `/api/watchlist/${userId}/import`, { xml });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist', userId] });
      toast({
        title: "Import Successful",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/watchlist/${userId}/export`);
      if (!res.ok) throw new Error("Failed to export watchlist");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watchlist-${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `Exported ${sortedWatchlist.length} stocks to XML file`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export watchlist",
        variant: "destructive",
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xml')) {
      toast({
        title: "Invalid File",
        description: "Please select an XML file",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const xml = event.target?.result as string;
      importMutation.mutate(xml);
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sortedWatchlist = watchlist?.slice().sort((a, b) => b.addedAt - a.addedAt) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept=".xml"
          onChange={handleFileChange}
          className="hidden"
          data-testid="input-import-file"
        />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
              My Watchlist
            </h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? (
                "Loading..."
              ) : sortedWatchlist.length === 0 ? (
                "No stocks in your watchlist yet"
              ) : (
                `Tracking ${sortedWatchlist.length} stock${sortedWatchlist.length !== 1 ? "s" : ""}`
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                disabled={importMutation.isPending}
                className="gap-2"
                data-testid="button-import-watchlist"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={sortedWatchlist.length === 0}
                className="gap-2"
                data-testid="button-export-watchlist"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            {sortedWatchlist.length > 0 && (
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="gap-2"
                  data-testid="button-view-table"
                >
                  <TableIcon className="h-4 w-4" />
                  Table
                </Button>
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="gap-2"
                  data-testid="button-view-cards"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Cards
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <WatchlistCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedWatchlist.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <Star className="h-10 w-10 text-muted-foreground" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start by searching for a stock and adding it to your watchlist to track its performance.
              </p>
              <div className="max-w-sm mx-auto mb-4">
                <StockSearch size="large" placeholder="Search for a stock..." />
              </div>
              <p className="text-sm text-muted-foreground">
                Or try one of the{" "}
                <Link href="/" className="text-primary hover:underline">
                  popular stocks
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "table" ? (
          <WatchlistTable watchlist={sortedWatchlist} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedWatchlist.map((item) => (
              <WatchlistCard key={item.id} symbol={item.symbol} />
            ))}
          </div>
        )}
      </main>

      <footer className="py-6 border-t mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Your watchlist is stored locally using an anonymous ID. No account required.
          </p>
        </div>
      </footer>
    </div>
  );
}
