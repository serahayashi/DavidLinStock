import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { AnalystRating } from "@shared/schema";

interface AnalystRatingsProps {
  ratings: AnalystRating | null;
  isLoading?: boolean;
}

export function AnalystRatings({ ratings, isLoading }: AnalystRatingsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Analyst Ratings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!ratings || ratings.totalAnalysts === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Analyst Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            No analyst ratings available for this stock.
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = ratings.totalAnalysts;
  const ratingData = [
    { label: "Strong Buy", value: ratings.strongBuy, color: "bg-emerald-500" },
    { label: "Buy", value: ratings.buy, color: "bg-green-400" },
    { label: "Hold", value: ratings.hold, color: "bg-yellow-400" },
    { label: "Sell", value: ratings.sell, color: "bg-orange-400" },
    { label: "Strong Sell", value: ratings.strongSell, color: "bg-red-500" },
  ];

  const overallScore = (
    (ratings.strongBuy * 5 + ratings.buy * 4 + ratings.hold * 3 + ratings.sell * 2 + ratings.strongSell * 1) / 
    total
  ).toFixed(1);

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return "Strong Buy";
    if (score >= 3.5) return "Buy";
    if (score >= 2.5) return "Hold";
    if (score >= 1.5) return "Sell";
    return "Strong Sell";
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Analyst Ratings</CardTitle>
          <span className="text-sm text-muted-foreground">
            {total} analyst{total !== 1 ? "s" : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-4xl font-bold tabular-nums font-mono" data-testid="text-analyst-score">
            {overallScore}
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Overall Rating</div>
            <div className="font-semibold text-stock-positive">{getScoreLabel(parseFloat(overallScore))}</div>
          </div>
        </div>
        
        <div className="space-y-3">
          {ratingData.map(({ label, value, color }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono font-medium tabular-nums">
                  {value} ({((value / total) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${color} transition-all duration-500`}
                  style={{ width: `${(value / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
