import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number | null;
  tooltip?: string;
  format?: "currency" | "percent" | "number" | "compact";
  isLoading?: boolean;
  className?: string;
}

export function MetricCard({ 
  label, 
  value, 
  tooltip, 
  format = "number",
  isLoading,
  className 
}: MetricCardProps) {
  const formatValue = (val: string | number | null) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "string") return val;
    
    switch (format) {
      case "currency":
        return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case "percent":
        return `${val.toFixed(2)}%`;
      case "compact":
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
        return `$${val.toLocaleString()}`;
      default:
        return typeof val === "number" ? val.toFixed(2) : val;
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-7 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="text-xl font-bold tabular-nums font-mono" data-testid={`text-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
          {formatValue(value)}
        </div>
      </CardContent>
    </Card>
  );
}
