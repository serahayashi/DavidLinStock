import { Link } from "wouter";
import { TrendingUp, Search, Star, BarChart3, LineChart, Activity, Users, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockSearch } from "@/components/stock-search";
import { Header } from "@/components/header";
import { useQuery } from "@tanstack/react-query";
import { SiReddit } from "react-icons/si";

const popularStocks = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "TSLA", name: "Tesla, Inc." },
];

interface TopWatchlistStock {
  symbol: string;
  watchlistCount: number;
  zacksRank: number | null;
  zacksText: string | null;
  rsi: number | null;
  rsiSignal: string;
}

interface WSBStock {
  symbol: string;
  sentiment: string;
  sentimentScore: number;
  comments: number;
  zacksRank: number | null;
  zacksText: string | null;
  rsi: number | null;
  rsiSignal: string;
}

function getRsiColor(signal: string): string {
  switch (signal) {
    case "Buy": return "text-green-600 dark:text-green-400";
    case "Sell": return "text-red-600 dark:text-red-400";
    default: return "text-muted-foreground";
  }
}

function getZacksColor(rank: number | null): string {
  if (rank === null) return "text-muted-foreground";
  if (rank <= 2) return "text-green-600 dark:text-green-400";
  if (rank === 3) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getSentimentColor(sentiment: string): string {
  if (sentiment === "Bullish") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (sentiment === "Bearish") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
}

const features = [
  {
    icon: Search,
    title: "Instant Search",
    description: "Find any stock by ticker symbol with real-time autocomplete suggestions.",
  },
  {
    icon: BarChart3,
    title: "Analyst Ratings",
    description: "View aggregated ratings from hundreds of analysts in one simple score.",
  },
  {
    icon: LineChart,
    title: "Price History",
    description: "Interactive charts showing 30, 90, and 180-day price movements.",
  },
  {
    icon: Activity,
    title: "MACD Indicator",
    description: "Technical analysis with MACD visualization and signal line crossovers.",
  },
  {
    icon: Star,
    title: "Personal Watchlist",
    description: "Save your favorite stocks and track them all in one place.",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Data",
    description: "Up-to-date stock prices, P/E ratios, and key financial metrics.",
  },
];

export default function Home() {
  const { data: topWatchlist, isLoading: isLoadingWatchlist, isError: isErrorWatchlist, refetch: refetchWatchlist } = useQuery<TopWatchlistStock[]>({
    queryKey: ['/api/stocks/top-watchlist'],
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const { data: wsbTrending, isLoading: isLoadingWSB, isError: isErrorWSB, refetch: refetchWSB } = useQuery<WSBStock[]>({
    queryKey: ['/api/stocks/trending-wsb'],
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">StockLens</h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Stock research made simple. View aggregated analyst ratings, 
              real-time prices, and technical indicators for any stock.
            </p>
            <div className="max-w-xl mx-auto mb-8">
              <StockSearch size="large" placeholder="Search by ticker (e.g., AAPL, TSLA)" autoFocus />
            </div>
            <p className="text-sm text-muted-foreground">
              No login required. Start tracking stocks instantly.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Popular Stocks</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {popularStocks.map((stock) => (
              <Link key={stock.symbol} href={`/stock/${stock.symbol}`}>
                <Card className="overflow-visible hover-elevate active-elevate-2 h-full">
                  <CardContent className="p-4 text-center">
                    <div className="font-mono font-bold text-lg mb-1" data-testid={`link-popular-${stock.symbol}`}>
                      {stock.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {stock.name}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-center">Top Watchlist Stocks</h2>
          </div>
          <p className="text-center text-muted-foreground mb-8">
            Most popular stocks among our users with Zacks ratings and RSI signals
          </p>
          
          {isLoadingWatchlist ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isErrorWatchlist ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Unable to fetch watchlist data.</p>
              <Button variant="outline" onClick={() => refetchWatchlist()} data-testid="button-retry-watchlist">
                Try Again
              </Button>
            </div>
          ) : topWatchlist && topWatchlist.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
              {topWatchlist.map((stock) => (
                <Link key={stock.symbol} href={`/stock/${stock.symbol}`}>
                  <Card className="overflow-visible hover-elevate active-elevate-2 h-full" data-testid={`card-top-watchlist-${stock.symbol}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="font-mono font-bold text-lg">{stock.symbol}</div>
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {stock.watchlistCount}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Zacks:</span>
                          <span className={`font-medium ${getZacksColor(stock.zacksRank)}`}>
                            {stock.zacksText || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">RSI Signal:</span>
                          <span className={`font-medium ${getRsiColor(stock.rsiSignal)}`}>
                            {stock.rsiSignal}
                            {stock.rsi !== null && ` (${stock.rsi.toFixed(1)})`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No watchlist data available yet. Add stocks to your watchlist to see trending stocks.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <SiReddit className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-center">Trending on r/wallstreetbets</h2>
          </div>
          <p className="text-center text-muted-foreground mb-8">
            Top 10 stocks being discussed with community sentiment and technical ratings
          </p>
          
          {isLoadingWSB ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isErrorWSB ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Unable to fetch trending stocks from r/wallstreetbets.</p>
              <Button variant="outline" onClick={() => refetchWSB()} data-testid="button-retry-wsb">
                Try Again
              </Button>
            </div>
          ) : wsbTrending && wsbTrending.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
              {wsbTrending.map((stock, index) => (
                <Link key={stock.symbol} href={`/stock/${stock.symbol}`}>
                  <Card className="overflow-visible hover-elevate active-elevate-2 h-full" data-testid={`card-wsb-${stock.symbol}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">#{index + 1}</span>
                          <span className="font-mono font-bold text-lg">{stock.symbol}</span>
                        </div>
                        <Badge className={getSentimentColor(stock.sentiment)}>
                          {stock.sentiment}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> Mentions:
                          </span>
                          <span className="font-medium">{stock.comments}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Zacks:</span>
                          <span className={`font-medium ${getZacksColor(stock.zacksRank)}`}>
                            {stock.zacksText || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">RSI Signal:</span>
                          <span className={`font-medium ${getRsiColor(stock.rsiSignal)}`}>
                            {stock.rsiSignal}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Unable to fetch trending stocks. Please try again later.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            StockLens aggregates data from multiple sources to give you a comprehensive 
            view of any stock's performance and analyst sentiment.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="overflow-visible">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Start Tracking Stocks</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Search for any stock to view detailed information, or create a watchlist 
            to keep track of your favorite stocks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="max-w-md flex-1">
              <StockSearch size="large" />
            </div>
            <Link href="/watchlist">
              <Button size="lg" variant="outline" className="gap-2 h-14 px-6">
                <Star className="h-5 w-5" />
                View Watchlist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            StockLens provides informational data only. This is not financial advice. 
            Stock data provided by Finnhub.
          </p>
        </div>
      </footer>
    </div>
  );
}
