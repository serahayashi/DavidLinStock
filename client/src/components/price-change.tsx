import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceChangeProps {
  change: number;
  changePercent: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function PriceChange({ 
  change, 
  changePercent, 
  size = "md",
  showIcon = true,
  className 
}: PriceChangeProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const formatChange = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    if (value > 0) return `+$${formatted}`;
    if (value < 0) return `-$${formatted}`;
    return `$${formatted}`;
  };

  const formatPercent = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    if (value > 0) return `+${formatted}%`;
    if (value < 0) return `-${formatted}%`;
    return `${formatted}%`;
  };

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg font-semibold",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono tabular-nums",
        isPositive && "bg-stock-positive-bg text-stock-positive",
        isNegative && "bg-stock-negative-bg text-stock-negative",
        isNeutral && "bg-muted text-muted-foreground",
        sizeClasses[size],
        className
      )}
      data-testid="text-price-change"
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{formatChange(change)}</span>
      <span>({formatPercent(changePercent)})</span>
    </div>
  );
}
