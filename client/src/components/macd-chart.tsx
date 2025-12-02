import { 
  ComposedChart, 
  Line, 
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { MACDData } from "@shared/schema";

interface MACDChartProps {
  data: MACDData[];
  isLoading?: boolean;
}

export function MACDChart({ data, isLoading }: MACDChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const hasData = data.length > 0;
  const recentData = data.slice(-30);

  const processedData = recentData.map(d => ({
    ...d,
    positiveHistogram: d.histogram >= 0 ? d.histogram : 0,
    negativeHistogram: d.histogram < 0 ? d.histogram : 0,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">MACD</CardTitle>
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold">MACD</CardTitle>
          <UITooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium mb-1">Moving Average Convergence Divergence</p>
              <p className="text-sm text-muted-foreground">
                MACD is a trend-following momentum indicator that shows the relationship between 
                two moving averages. The histogram represents the difference between the MACD line 
                and Signal line.
              </p>
            </TooltipContent>
          </UITooltip>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-sm bg-chart-1" />
            <span className="text-muted-foreground">MACD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-sm bg-chart-4" />
            <span className="text-muted-foreground">Signal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-sm bg-stock-positive" />
            <span className="text-muted-foreground">Histogram</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">MACD data unavailable</p>
            </div>
          </div>
        ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={processedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={50}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                orientation="right"
                width={50}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  padding: "12px",
                }}
                labelFormatter={(label) => formatDate(label as string)}
                formatter={(value: number, name: string) => {
                  const label = name === "macd" ? "MACD" : name === "signal" ? "Signal" : "Histogram";
                  return [value.toFixed(3), label];
                }}
              />
              <Bar 
                dataKey="positiveHistogram" 
                fill="hsl(var(--stock-positive))" 
                opacity={0.6}
                name="histogram"
              />
              <Bar 
                dataKey="negativeHistogram" 
                fill="hsl(var(--stock-negative))" 
                opacity={0.6}
                name="histogram"
              />
              <Line
                type="monotone"
                dataKey="macd"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
                name="macd"
              />
              <Line
                type="monotone"
                dataKey="signal"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={false}
                name="signal"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
