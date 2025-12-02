import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Star, ArrowLeft, LayoutGrid, Table as TableIcon, Download, Upload, Share2, Copy, Check, X, Trash2, Loader2, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { WatchlistCard, WatchlistCardSkeleton } from "@/components/watchlist-card";
import { WatchlistTable } from "@/components/watchlist-table";
import { StockSearch } from "@/components/stock-search";
import { getUserId } from "@/lib/userId";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { WatchlistItem, SavedWatchlist } from "@shared/schema";

type ViewMode = "cards" | "table";

interface HydratedSavedWatchlist extends SavedWatchlist {
  isActive: boolean;
  symbols: string[];
  ownerLabel: string | null;
}

interface ShareResponse {
  shareId: string;
  shareUrl: string;
  label: string | null;
  createdAt: number;
}

export default function WatchlistPage() {
  const userId = getUserId();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeTab, setActiveTab] = useState("my-watchlist");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLabel, setShareLabel] = useState("");
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
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

  const { data: savedWatchlists, isLoading: isLoadingSaved } = useQuery<HydratedSavedWatchlist[]>({
    queryKey: ['/api/watchlist', userId, 'saved'],
    queryFn: async () => {
      const res = await fetch(`/api/watchlist/${userId}/saved`);
      if (!res.ok) throw new Error("Failed to fetch saved watchlists");
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

  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/watchlist/${userId}/share`, { 
        label: shareLabel.trim() || null 
      });
      return res.json() as Promise<ShareResponse>;
    },
    onSuccess: (data) => {
      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      setCreatedShareUrl(fullUrl);
      toast({
        title: "Share Link Created",
        description: "Your watchlist can now be shared with others",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Share Link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeSavedMutation = useMutation({
    mutationFn: async (shareId: string) => {
      return apiRequest("DELETE", `/api/watchlist/${userId}/saved/${shareId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist', userId, 'saved'] });
      toast({
        title: "Watchlist Removed",
        description: "The saved watchlist has been removed from your dashboard",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Remove",
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

  const handleShare = () => {
    shareMutation.mutate();
  };

  const handleCopyShareUrl = async () => {
    if (createdShareUrl) {
      await navigator.clipboard.writeText(createdShareUrl);
      setCopiedShareUrl(true);
      setTimeout(() => setCopiedShareUrl(false), 2000);
    }
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setShareLabel("");
    setCreatedShareUrl(null);
    setCopiedShareUrl(false);
  };

  const sortedWatchlist = watchlist?.slice().sort((a, b) => b.addedAt - a.addedAt) ?? [];
  const activeSavedWatchlists = savedWatchlists?.filter(sw => sw.isActive) ?? [];

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="my-watchlist" className="gap-2" data-testid="tab-my-watchlist">
                <Star className="h-4 w-4" />
                My Watchlist
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2" data-testid="tab-saved-watchlists">
                <Users className="h-4 w-4" />
                Saved
                {activeSavedWatchlists.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{activeSavedWatchlists.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {activeTab === "my-watchlist" && (
              <div className="flex items-center gap-2 flex-wrap">
                <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={sortedWatchlist.length === 0}
                      className="gap-2"
                      data-testid="button-share-watchlist"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share Your Watchlist</DialogTitle>
                      <DialogDescription>
                        Create a link that others can use to view and save your watchlist
                      </DialogDescription>
                    </DialogHeader>
                    
                    {!createdShareUrl ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="shareLabel">Watchlist Name (optional)</Label>
                          <Input
                            id="shareLabel"
                            placeholder="e.g., Tech Stocks, My Portfolio"
                            value={shareLabel}
                            onChange={(e) => setShareLabel(e.target.value)}
                            data-testid="input-share-label"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={handleCloseShareDialog}>Cancel</Button>
                          <Button 
                            onClick={handleShare} 
                            disabled={shareMutation.isPending}
                            className="gap-2"
                            data-testid="button-create-share-link"
                          >
                            {shareMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Share2 className="h-4 w-4" />
                            )}
                            Create Share Link
                          </Button>
                        </DialogFooter>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Share Link</Label>
                          <div className="flex gap-2">
                            <Input 
                              value={createdShareUrl} 
                              readOnly 
                              className="font-mono text-sm"
                              data-testid="input-share-url"
                            />
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={handleCopyShareUrl}
                              data-testid="button-copy-share-url"
                            >
                              {copiedShareUrl ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Anyone with this link can view your current watchlist
                          </p>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCloseShareDialog}>Done</Button>
                        </DialogFooter>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

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
            )}
          </div>

          <TabsContent value="my-watchlist" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                Saved Watchlists
              </h1>
              <p className="text-muted-foreground mt-1">
                Watchlists from other users that you've saved
              </p>
            </div>

            {isLoadingSaved ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeSavedWatchlists.length === 0 ? (
              <Card className="max-w-lg mx-auto">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-10 w-10 text-muted-foreground" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">No saved watchlists</h2>
                  <p className="text-muted-foreground mb-6">
                    When someone shares their watchlist with you, you can save it here to track their picks.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Visit a shared watchlist link to save it to your dashboard
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeSavedWatchlists.map((saved) => (
                  <Card key={saved.id} className="overflow-visible" data-testid={`card-saved-watchlist-${saved.shareId}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            {saved.alias || saved.ownerLabel || "Shared Watchlist"}
                          </CardTitle>
                          <CardDescription>
                            {saved.symbols.length} stock{saved.symbols.length !== 1 ? "s" : ""}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSavedMutation.mutate(saved.shareId)}
                          disabled={removeSavedMutation.isPending}
                          data-testid={`button-remove-saved-${saved.shareId}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {saved.symbols.slice(0, 6).map((symbol) => (
                          <Link key={symbol} href={`/stock/${symbol}`}>
                            <Badge variant="secondary" className="font-mono cursor-pointer">
                              {symbol}
                            </Badge>
                          </Link>
                        ))}
                        {saved.symbols.length > 6 && (
                          <Badge variant="outline">+{saved.symbols.length - 6} more</Badge>
                        )}
                      </div>
                      <Link href={`/share/${saved.shareId}`}>
                        <Button variant="outline" size="sm" className="w-full gap-2" data-testid={`button-view-saved-${saved.shareId}`}>
                          <ExternalLink className="h-4 w-4" />
                          View Full Watchlist
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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
