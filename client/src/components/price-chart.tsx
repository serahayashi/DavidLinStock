import { useState } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PriceHistoryPoint } from "@shared/schema";

interface PriceChartProps {
  data: PriceHistoryPoint[];
  isLoading?: boolean;
  currentPrice?: number;
  previousClose?: number;
}

type TimeRange = "30" | "90" | "180";

export function PriceChart({ data, isLoading, currentPrice, previousClose }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30");

  const filteredData = data.slice(-parseInt(timeRange));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;

  const hasData = filteredData.length > 0;
  const minPrice = hasData ? Math.min(...filteredData.map(d => d.low)) * 0.995 : 0;
  const maxPrice = hasData ? Math.max(...filteredData.map(d => d.high)) * 1.005 : 100;

  const isPositive = currentPrice && previousClose ? currentPrice >= previousClose : true;
  const lineColor = isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)";

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Price History</CardTitle>
          <div className="flex gap-1">
            {["30D", "90D", "180D"].map((label) => (
              <Skeleton key={label} className="h-8 w-12" />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Price History</CardTitle>
        <div className="flex gap-1">
          {(["30", "90", "180"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={cn(
                "font-mono text-xs",
                timeRange === range && "pointer-events-none"
              )}
              data-testid={`button-timerange-${range}`}
            >
              {range}D
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-1">Price history unavailable</p>
              <p className="text-sm">Historical data is not available for this stock at the moment.</p>
            </div>
          </div>
        ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={50}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tickFormatter={formatPrice}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                orientation="right"
                width={70}
              />
              {previousClose && (
                <ReferenceLine
                  y={previousClose}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  padding: "12px",
                }}
                labelFormatter={(label) => formatDate(label as string)}
                formatter={(value: number) => [formatPrice(value), "Close"]}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
