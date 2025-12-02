import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Star, Loader2, ExternalLink, AlertCircle, BookmarkPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserId } from "@/lib/userId";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface SharedWatchlistData {
  shareId: string;
  label: string | null;
  createdAt: number;
  symbols: string[];
  stockCount: number;
}

export default function SharePage() {
  const [, params] = useRoute("/share/:shareId");
  const shareId = params?.shareId;
  const userId = getUserId();
  const { toast } = useToast();
  const [alias, setAlias] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const { data: shareData, isLoading, isError } = useQuery<SharedWatchlistData>({
    queryKey: ['/api/share', shareId],
    queryFn: async () => {
      const res = await fetch(`/api/share/${shareId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("This shared watchlist doesn't exist or has been revoked.");
        }
        throw new Error("Failed to load shared watchlist");
      }
      return res.json();
    },
    enabled: !!shareId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/watchlist/${userId}/saved`, { 
        shareId, 
        alias: alias.trim() || null 
      });
    },
    onSuccess: () => {
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist', userId, 'saved'] });
      toast({
        title: "Watchlist Saved",
        description: "This watchlist has been added to your dashboard",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (!shareId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Share Link</h2>
              <p className="text-muted-foreground mb-4">
                This share link appears to be invalid.
              </p>
              <Link href="/">
                <Button data-testid="button-go-home">Go to Homepage</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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

        {isLoading ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : isError ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Watchlist Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This shared watchlist doesn't exist or has been revoked by the owner.
              </p>
              <Link href="/">
                <Button data-testid="button-go-home">Go to Homepage</Button>
              </Link>
            </CardContent>
          </Card>
        ) : shareData ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                      {shareData.label || "Shared Watchlist"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {shareData.stockCount} stock{shareData.stockCount !== 1 ? "s" : ""} in this watchlist
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {shareData.symbols.map((symbol) => (
                    <Link key={symbol} href={`/stock/${symbol}`}>
                      <Card className="overflow-visible hover-elevate active-elevate-2" data-testid={`card-shared-stock-${symbol}`}>
                        <CardContent className="p-3 text-center">
                          <div className="font-mono font-bold text-lg">{symbol}</div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                            View <ExternalLink className="h-3 w-3" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookmarkPlus className="h-5 w-5" />
                  Save to Your Dashboard
                </CardTitle>
                <CardDescription>
                  Add this watchlist to your dashboard to easily track these stocks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSaved ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="h-5 w-5" />
                    <span>This watchlist has been saved to your dashboard!</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="alias">Give it a name (optional)</Label>
                      <Input
                        id="alias"
                        placeholder="e.g., Tech Stocks, Friend's Portfolio"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        data-testid="input-watchlist-alias"
                      />
                    </div>
                    <Button 
                      onClick={handleSave} 
                      disabled={saveMutation.isPending}
                      className="gap-2"
                      data-testid="button-save-watchlist"
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BookmarkPlus className="h-4 w-4" />
                      )}
                      Save to Dashboard
                    </Button>
                  </>
                )}
                <div className="pt-2">
                  <Link href="/watchlist">
                    <Button variant="outline" className="gap-2" data-testid="button-view-watchlist">
                      <Star className="h-4 w-4" />
                      View My Watchlist
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>

      <footer className="py-6 border-t mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            StockLens provides informational data only. This is not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
