import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3, Target } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TechnicalIndicators } from "@shared/schema";

interface TechnicalAnalysisProps {
  indicators: TechnicalIndicators | null;
  currentPrice?: number;
  isLoading?: boolean;
}

function formatNumber(value: number | null, decimals: number = 2): string {
  if (value === null) return "N/A";
  return value.toFixed(decimals);
}

function getRSISignal(rsi: number | null): { text: string; color: string; description: string } {
  if (rsi === null) return { text: "N/A", color: "bg-muted", description: "Insufficient data" };
  if (rsi >= 70) return { text: "Overbought", color: "bg-red-500/20 text-red-600 dark:text-red-400", description: "RSI above 70 suggests the stock may be overbought" };
  if (rsi <= 30) return { text: "Oversold", color: "bg-green-500/20 text-green-600 dark:text-green-400", description: "RSI below 30 suggests the stock may be oversold" };
  return { text: "Neutral", color: "bg-muted", description: "RSI between 30-70 is considered neutral" };
}

function getSMASignal(currentPrice: number | undefined, sma: number | null): { text: string; color: string } {
  if (!currentPrice || sma === null) return { text: "N/A", color: "text-muted-foreground" };
  if (currentPrice > sma) return { text: "Above", color: "text-green-600 dark:text-green-400" };
  return { text: "Below", color: "text-red-600 dark:text-red-400" };
}

function getBollingerSignal(currentPrice: number | undefined, upper: number | null, lower: number | null): { text: string; color: string; description: string } {
  if (!currentPrice || upper === null || lower === null) return { text: "N/A", color: "bg-muted", description: "Insufficient data" };
  if (currentPrice >= upper) return { text: "Upper Band", color: "bg-red-500/20 text-red-600 dark:text-red-400", description: "Price near upper band suggests potential resistance" };
  if (currentPrice <= lower) return { text: "Lower Band", color: "bg-green-500/20 text-green-600 dark:text-green-400", description: "Price near lower band suggests potential support" };
  return { text: "Mid Range", color: "bg-muted", description: "Price is within normal trading range" };
}

function getMomentumSignal(momentum: number | null): { icon: typeof TrendingUp; color: string } {
  if (momentum === null) return { icon: Activity, color: "text-muted-foreground" };
  if (momentum > 0) return { icon: TrendingUp, color: "text-green-600 dark:text-green-400" };
  return { icon: TrendingDown, color: "text-red-600 dark:text-red-400" };
}

export function TechnicalAnalysis({ indicators, currentPrice, isLoading }: TechnicalAnalysisProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Technical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!indicators) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Technical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Insufficient price data for technical analysis</p>
        </CardContent>
      </Card>
    );
  }

  const rsiSignal = getRSISignal(indicators.rsi);
  const bollingerSignal = getBollingerSignal(currentPrice, indicators.bollingerUpper, indicators.bollingerLower);
  const momentumSignal = getMomentumSignal(indicators.momentum);
  const MomentumIcon = momentumSignal.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          Technical Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium cursor-help">RSI (14)</span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[250px]">
                <p>Relative Strength Index measures momentum. Values above 70 suggest overbought conditions, below 30 suggest oversold.</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm" data-testid="text-rsi-value">{formatNumber(indicators.rsi, 1)}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className={`text-xs ${rsiSignal.color}`} data-testid="badge-rsi-signal">
                    {rsiSignal.text}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{rsiSignal.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
              style={{ width: `${Math.min(100, Math.max(0, indicators.rsi ?? 50))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help">SMA 20</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>20-day Simple Moving Average</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm" data-testid="text-sma20">${formatNumber(indicators.sma20)}</span>
              <span className={`text-xs ${getSMASignal(currentPrice, indicators.sma20).color}`}>
                {getSMASignal(currentPrice, indicators.sma20).text}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help">SMA 50</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>50-day Simple Moving Average</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm" data-testid="text-sma50">${formatNumber(indicators.sma50)}</span>
              <span className={`text-xs ${getSMASignal(currentPrice, indicators.sma50).color}`}>
                {getSMASignal(currentPrice, indicators.sma50).text}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help">SMA 200</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>200-day Simple Moving Average (long-term trend)</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm" data-testid="text-sma200">${formatNumber(indicators.sma200)}</span>
              <span className={`text-xs ${getSMASignal(currentPrice, indicators.sma200).color}`}>
                {getSMASignal(currentPrice, indicators.sma200).text}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help">ATR (14)</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Average True Range measures volatility</p>
              </TooltipContent>
            </Tooltip>
            <span className="font-mono text-sm block" data-testid="text-atr">${formatNumber(indicators.atr)}</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium cursor-help flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Bollinger Bands
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[250px]">
                <p>Bollinger Bands show price volatility. Price near upper band suggests resistance, near lower band suggests support.</p>
              </TooltipContent>
            </Tooltip>
            <Badge variant="secondary" className={`text-xs ${bollingerSignal.color}`} data-testid="badge-bollinger-signal">
              {bollingerSignal.text}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-xs text-muted-foreground block">Upper</span>
              <span className="font-mono text-xs" data-testid="text-bollinger-upper">${formatNumber(indicators.bollingerUpper)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Middle</span>
              <span className="font-mono text-xs" data-testid="text-bollinger-middle">${formatNumber(indicators.bollingerMiddle)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Lower</span>
              <span className="font-mono text-xs" data-testid="text-bollinger-lower">${formatNumber(indicators.bollingerLower)}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium cursor-help">Momentum (10)</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>10-day price momentum. Positive values indicate upward trend, negative indicate downward.</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-2">
              <MomentumIcon className={`h-4 w-4 ${momentumSignal.color}`} />
              <span className={`font-mono text-sm ${momentumSignal.color}`} data-testid="text-momentum">
                {indicators.momentum !== null ? (indicators.momentum > 0 ? "+" : "") + formatNumber(indicators.momentum) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
