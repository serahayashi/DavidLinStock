import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { PriceChange } from "@/components/price-change";
import { PriceChart } from "@/components/price-chart";
import { MACDChart } from "@/components/macd-chart";
import { AnalystRatings } from "@/components/analyst-ratings";
import { ZacksRatingDisplay } from "@/components/zacks-rating";
import { MetricCard } from "@/components/metric-card";
import { WatchlistButton } from "@/components/watchlist-button";
import type { StockDetail } from "@shared/schema";

export default function StockDetailPage() {
  const [, params] = useRoute("/stock/:symbol");
  const symbol = params?.symbol?.toUpperCase();

  const { data, isLoading, error } = useQuery<StockDetail>({
    queryKey: ['/api/stocks', symbol],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch stock details");
      return res.json();
    },
    enabled: !!symbol,
  });

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!symbol) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-2">Stock Not Found</h1>
            <p className="text-muted-foreground mb-4">No ticker symbol provided.</p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-2">Error Loading Stock</h1>
            <p className="text-muted-foreground mb-4">
              Could not find stock data for "{symbol}". Please check the ticker symbol.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-visible">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    {isLoading ? (
                      <>
                        <Skeleton className="h-8 w-24 mb-2" />
                        <Skeleton className="h-5 w-48" />
                      </>
                    ) : (
                      <>
                        <h1 className="text-3xl font-mono font-bold" data-testid="text-stock-symbol">
                          {data?.quote.symbol}
                        </h1>
                        <p className="text-lg text-muted-foreground" data-testid="text-stock-name">
                          {data?.quote.name}
                        </p>
                      </>
                    )}
                  </div>
                  <WatchlistButton symbol={symbol} />
                </div>

                <div className="mt-6 flex flex-wrap items-end gap-4">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-12 w-32" />
                      <Skeleton className="h-8 w-36" />
                    </>
                  ) : (
                    <>
                      <div className="text-4xl md:text-5xl font-bold tabular-nums font-mono" data-testid="text-current-price">
                        ${data?.quote.price.toFixed(2)}
                      </div>
                      <PriceChange
                        change={data?.quote.change ?? 0}
                        changePercent={data?.quote.changePercent ?? 0}
                        size="lg"
                      />
                    </>
                  )}
                </div>

                {isLoading ? (
                  <Skeleton className="h-4 w-48 mt-4" />
                ) : (
                  <div className="flex items-center gap-1.5 mt-4 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Last updated: {formatTimestamp(data?.quote.timestamp ?? 0)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <PriceChart 
              data={data?.priceHistory ?? []}
              isLoading={isLoading}
              currentPrice={data?.quote.price}
              previousClose={data?.quote.previousClose}
            />

            <MACDChart
              data={data?.macd ?? []}
              isLoading={isLoading}
            />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="P/E Ratio"
                value={data?.metrics.peRatio ?? null}
                tooltip="Price-to-Earnings ratio measures a company's current stock price relative to its per-share earnings. A high P/E could mean a stock is overvalued, or investors expect high growth rates."
                isLoading={isLoading}
              />
              <MetricCard
                label="Market Cap"
                value={data?.metrics.marketCap ?? null}
                format="compact"
                tooltip="Market capitalization is the total market value of a company's outstanding shares. It's calculated by multiplying the stock price by the number of shares."
                isLoading={isLoading}
              />
              <MetricCard
                label="52W High"
                value={data?.metrics.high52Week ?? null}
                format="currency"
                tooltip="The highest price at which the stock has traded during the past 52 weeks (one year)."
                isLoading={isLoading}
              />
              <MetricCard
                label="52W Low"
                value={data?.metrics.low52Week ?? null}
                format="currency"
                tooltip="The lowest price at which the stock has traded during the past 52 weeks (one year)."
                isLoading={isLoading}
              />
              <MetricCard
                label="Beta"
                value={data?.metrics.beta ?? null}
                tooltip="Beta measures a stock's volatility compared to the overall market. A beta greater than 1 indicates higher volatility, while less than 1 indicates lower volatility."
                isLoading={isLoading}
              />
              <MetricCard
                label="EPS"
                value={data?.metrics.eps ?? null}
                format="currency"
                tooltip="Earnings Per Share represents the portion of a company's profit allocated to each outstanding share of common stock."
                isLoading={isLoading}
              />
            </div>

            <AnalystRatings 
              ratings={data?.analystRatings ?? null}
              isLoading={isLoading}
            />

            <ZacksRatingDisplay
              rating={data?.zacksRating ?? null}
              isLoading={isLoading}
            />

            <Card className="overflow-visible">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <a
                    href={`https://finance.yahoo.com/quote/${symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-yahoo-finance"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Yahoo Finance
                  </a>
                  <a
                    href={`https://www.google.com/finance/quote/${symbol}:NASDAQ`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-google-finance"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Google Finance
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Data provided for informational purposes only. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
