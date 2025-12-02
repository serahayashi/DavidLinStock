import type { 
  StockQuote, 
  StockMetrics, 
  PriceHistoryPoint, 
  MACDData,
  AnalystRating,
  StockSearchResult,
  StockDetail 
} from "@shared/schema";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = "https://finnhub.io/api/v1";
const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query";

class FinnhubError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "FinnhubError";
  }
}

async function fetchFinnhub(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("token", FINNHUB_API_KEY || "");
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const errorMessages: Record<number, string> = {
      401: "Invalid API key",
      403: "API access restricted - check your Finnhub plan",
      429: "Rate limit exceeded - please try again later",
      404: "Resource not found",
    };
    throw new FinnhubError(
      response.status, 
      errorMessages[response.status] || `Finnhub API error: ${response.status}`
    );
  }
  
  return response.json();
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query || query.length < 1) {
    return [];
  }

  try {
    const data = await fetchFinnhub("/search", { q: query });
    
    if (!data.result) {
      return [];
    }

    return data.result
      .filter((item: any) => item.type === "Common Stock" && !item.symbol.includes("."))
      .slice(0, 10)
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.description,
        type: item.type,
      }));
  } catch (error) {
    console.error("Error searching stocks:", error);
    return [];
  }
}

export async function getQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const [quoteData, profileData] = await Promise.all([
      fetchFinnhub("/quote", { symbol }),
      fetchFinnhub("/stock/profile2", { symbol }),
    ]);

    if (!quoteData || quoteData.c === 0) {
      return null;
    }

    return {
      symbol: symbol.toUpperCase(),
      name: profileData?.name || symbol,
      price: quoteData.c,
      change: quoteData.d || 0,
      changePercent: quoteData.dp || 0,
      high: quoteData.h,
      low: quoteData.l,
      open: quoteData.o,
      previousClose: quoteData.pc,
      timestamp: quoteData.t,
    };
  } catch (error) {
    console.error("Error fetching quote:", error);
    return null;
  }
}

export async function getMetrics(symbol: string): Promise<StockMetrics> {
  try {
    const data = await fetchFinnhub("/stock/metric", { symbol, metric: "all" });
    
    const metrics = data?.metric || {};
    
    return {
      symbol: symbol.toUpperCase(),
      peRatio: metrics.peBasicExclExtraTTM || metrics.peNormalizedAnnual || null,
      marketCap: metrics.marketCapitalization ? metrics.marketCapitalization * 1e6 : null,
      beta: metrics.beta || null,
      dividendYield: metrics.dividendYieldIndicatedAnnual || null,
      eps: metrics.epsBasicExclExtraItemsTTM || metrics.epsNormalizedAnnual || null,
      high52Week: metrics["52WeekHigh"] || null,
      low52Week: metrics["52WeekLow"] || null,
    };
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return {
      symbol: symbol.toUpperCase(),
      peRatio: null,
      marketCap: null,
      beta: null,
      dividendYield: null,
      eps: null,
      high52Week: null,
      low52Week: null,
    };
  }
}

async function fetchAlphaVantagePriceHistory(symbol: string): Promise<PriceHistoryPoint[]> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.log("Alpha Vantage API key not configured");
    return [];
  }

  try {
    const url = `${ALPHA_VANTAGE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Alpha Vantage API error:", response.status);
      return [];
    }

    const data = await response.json();
    
    if (data["Error Message"] || data["Note"]) {
      console.error("Alpha Vantage error:", data["Error Message"] || data["Note"]);
      return [];
    }

    const timeSeries = data["Time Series (Daily)"];
    if (!timeSeries) {
      return [];
    }

    const points: PriceHistoryPoint[] = [];
    const dates = Object.keys(timeSeries).sort();
    
    for (const date of dates.slice(-180)) {
      const dayData = timeSeries[date];
      points.push({
        date,
        open: parseFloat(dayData["1. open"]),
        high: parseFloat(dayData["2. high"]),
        low: parseFloat(dayData["3. low"]),
        close: parseFloat(dayData["4. close"]),
        volume: parseInt(dayData["5. volume"]),
      });
    }

    return points;
  } catch (error) {
    console.error("Error fetching Alpha Vantage price history:", error);
    return [];
  }
}

export async function getPriceHistory(symbol: string, days: number = 180): Promise<PriceHistoryPoint[]> {
  // Try Finnhub first
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - (days * 24 * 60 * 60);
    
    const data = await fetchFinnhub("/stock/candle", {
      symbol,
      resolution: "D",
      from: from.toString(),
      to: to.toString(),
    });

    if (data.s === "ok" && data.c && data.c.length > 0) {
      const points: PriceHistoryPoint[] = [];
      for (let i = 0; i < data.c.length; i++) {
        const date = new Date(data.t[i] * 1000);
        points.push({
          date: date.toISOString().split("T")[0],
          close: data.c[i],
          high: data.h[i],
          low: data.l[i],
          open: data.o[i],
          volume: data.v[i],
        });
      }
      return points;
    }
  } catch (error) {
    console.log("Finnhub candle endpoint failed, trying Alpha Vantage...");
  }

  // Fallback to Alpha Vantage
  return fetchAlphaVantagePriceHistory(symbol);
}

function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i];
  }
  ema[period - 1] = sum / period;
  
  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  
  return ema;
}

export function calculateMACD(priceHistory: PriceHistoryPoint[]): MACDData[] {
  if (priceHistory.length < 26) {
    return [];
  }

  const closes = priceHistory.map(p => p.close);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  const macdLine: number[] = [];
  for (let i = 25; i < closes.length; i++) {
    macdLine[i] = ema12[i] - ema26[i];
  }
  
  const macdValues = macdLine.filter(v => v !== undefined);
  const signalLine = calculateEMA(macdValues, 9);
  
  const result: MACDData[] = [];
  let signalIndex = 0;
  
  for (let i = 33; i < priceHistory.length; i++) {
    const macd = macdLine[i];
    const signal = signalLine[signalIndex + 8];
    
    if (macd !== undefined && signal !== undefined) {
      result.push({
        date: priceHistory[i].date,
        macd: macd,
        signal: signal,
        histogram: macd - signal,
      });
    }
    signalIndex++;
  }
  
  return result;
}

export async function getAnalystRatings(symbol: string): Promise<AnalystRating | null> {
  try {
    const data = await fetchFinnhub("/stock/recommendation", { symbol });
    
    if (!data || data.length === 0) {
      return null;
    }

    const latest = data[0];
    const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
    
    if (total === 0) {
      return null;
    }

    return {
      symbol: symbol.toUpperCase(),
      strongBuy: latest.strongBuy,
      buy: latest.buy,
      hold: latest.hold,
      sell: latest.sell,
      strongSell: latest.strongSell,
      totalAnalysts: total,
    };
  } catch (error) {
    console.error("Error fetching analyst ratings:", error);
    return null;
  }
}

export async function getStockDetail(symbol: string): Promise<StockDetail | null> {
  try {
    const [quote, metrics, priceHistory, analystRatings] = await Promise.all([
      getQuote(symbol),
      getMetrics(symbol),
      getPriceHistory(symbol, 180),
      getAnalystRatings(symbol),
    ]);

    if (!quote) {
      return null;
    }

    const macd = calculateMACD(priceHistory);

    return {
      quote,
      metrics,
      priceHistory,
      macd,
      analystRatings,
    };
  } catch (error) {
    console.error("Error fetching stock detail:", error);
    return null;
  }
}
