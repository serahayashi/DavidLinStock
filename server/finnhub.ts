import type { 
  StockQuote, 
  StockMetrics, 
  PriceHistoryPoint, 
  MACDData,
  TechnicalIndicators,
  AnalystRating,
  StockSearchResult,
  StockDetail,
  ZacksRating,
  StockNews
} from "@shared/schema";

// @ts-ignore - zacks-api doesn't have type definitions
import * as zacksApi from "zacks-api";

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

async function fetchYahooFinancePriceHistory(symbol: string, days: number = 1825): Promise<PriceHistoryPoint[]> {
  console.log(`Fetching Yahoo Finance data for ${symbol}...`);
  
  try {
    // Use Yahoo Finance REST API directly (no ESM package issues)
    // Support longer time ranges: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y
    let range: string;
    if (days <= 7) range = "5d";
    else if (days <= 30) range = "1mo";
    else if (days <= 90) range = "3mo";
    else if (days <= 180) range = "6mo";
    else if (days <= 365) range = "1y";
    else if (days <= 730) range = "2y";
    else range = "5y";
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    
    if (!response.ok) {
      console.error("Yahoo Finance API error:", response.status);
      return [];
    }
    
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result) {
      console.log("No data from Yahoo Finance");
      return [];
    }
    
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    
    if (timestamps.length === 0) {
      console.log("No timestamps in Yahoo Finance response");
      return [];
    }
    
    console.log(`Yahoo Finance returned ${timestamps.length} days of data`);
    
    const points: PriceHistoryPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = quotes.close?.[i];
      if (close !== null && close !== undefined) {
        const date = new Date(timestamps[i] * 1000);
        points.push({
          date: date.toISOString().split("T")[0],
          open: quotes.open?.[i] || close,
          high: quotes.high?.[i] || close,
          low: quotes.low?.[i] || close,
          close: close,
          volume: quotes.volume?.[i] || 0,
        });
      }
    }
    
    return points;
  } catch (error) {
    console.error("Error fetching Yahoo Finance price history:", error);
    return [];
  }
}

async function fetchAlphaVantagePriceHistory(symbol: string): Promise<PriceHistoryPoint[]> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.log("Alpha Vantage API key not configured");
    return [];
  }

  console.log(`Fetching Alpha Vantage data for ${symbol}...`);
  
  try {
    const url = `${ALPHA_VANTAGE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Alpha Vantage API error:", response.status);
      return [];
    }

    const data = await response.json();
    console.log("Alpha Vantage response keys:", Object.keys(data));
    
    if (data["Error Message"]) {
      console.error("Alpha Vantage error:", data["Error Message"]);
      return [];
    }
    
    if (data["Note"]) {
      console.log("Alpha Vantage rate limit note:", data["Note"]);
      return [];
    }
    
    if (data["Information"]) {
      console.log("Alpha Vantage info:", data["Information"]);
      return [];
    }

    const timeSeries = data["Time Series (Daily)"];
    if (!timeSeries) {
      console.log("No time series data in Alpha Vantage response");
      return [];
    }
    
    console.log(`Alpha Vantage returned ${Object.keys(timeSeries).length} days of data`);

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
  // Try Yahoo Finance first (most reliable, no API key needed)
  const yahooData = await fetchYahooFinancePriceHistory(symbol, days);
  if (yahooData.length > 0) {
    return yahooData;
  }
  
  // Fallback to Finnhub
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

  // Final fallback to Alpha Vantage
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

function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

function calculateRSI(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null;
  
  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  const recentChanges = changes.slice(-period);
  let gains = 0;
  let losses = 0;
  
  for (const change of recentChanges) {
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateBollingerBands(closes: number[], period: number = 20): { upper: number | null; middle: number | null; lower: number | null } {
  if (closes.length < period) {
    return { upper: null, middle: null, lower: null };
  }
  
  const slice = closes.slice(-period);
  const middle = slice.reduce((sum, val) => sum + val, 0) / period;
  
  const squaredDiffs = slice.map(val => Math.pow(val - middle, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: middle + (2 * stdDev),
    middle,
    lower: middle - (2 * stdDev),
  };
}

function calculateATR(priceHistory: PriceHistoryPoint[], period: number = 14): number | null {
  if (priceHistory.length < period + 1) return null;
  
  const trueRanges: number[] = [];
  for (let i = 1; i < priceHistory.length; i++) {
    const high = priceHistory[i].high;
    const low = priceHistory[i].low;
    const prevClose = priceHistory[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((sum, val) => sum + val, 0) / period;
}

function calculateMomentum(closes: number[], period: number = 10): number | null {
  if (closes.length < period + 1) return null;
  return closes[closes.length - 1] - closes[closes.length - 1 - period];
}

export function calculateTechnicalIndicators(priceHistory: PriceHistoryPoint[]): TechnicalIndicators | null {
  if (priceHistory.length < 20) {
    return null;
  }
  
  const closes = priceHistory.map(p => p.close);
  const bollinger = calculateBollingerBands(closes, 20);
  
  return {
    rsi: calculateRSI(closes, 14),
    sma20: calculateSMA(closes, 20),
    sma50: calculateSMA(closes, 50),
    sma200: calculateSMA(closes, 200),
    bollingerUpper: bollinger.upper,
    bollingerMiddle: bollinger.middle,
    bollingerLower: bollinger.lower,
    atr: calculateATR(priceHistory, 14),
    momentum: calculateMomentum(closes, 10),
  };
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

export async function getZacksRating(symbol: string): Promise<ZacksRating | null> {
  try {
    const data = await zacksApi.getData(symbol.toUpperCase());
    
    if (!data || !data.zacksRank) {
      return null;
    }

    return {
      symbol: symbol.toUpperCase(),
      rank: parseInt(data.zacksRank, 10),
      rankText: data.zacksRankText || "",
      updatedAt: data.updatedAt || null,
    };
  } catch (error) {
    console.error("Error fetching Zacks rating:", error);
    return null;
  }
}

export async function getCompanyNews(symbol: string, limit: number = 3): Promise<StockNews[]> {
  try {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    
    const fromStr = from.toISOString().split("T")[0];
    const toStr = to.toISOString().split("T")[0];
    
    // Also fetch company profile to get the company name for filtering
    let companyName = "";
    try {
      const profile = await fetchFinnhub("/stock/profile2", { symbol });
      companyName = profile?.name?.toLowerCase() || "";
    } catch {
      // Continue without company name filtering
    }
    
    const data = await fetchFinnhub("/company-news", { 
      symbol, 
      from: fromStr, 
      to: toStr 
    });
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Filter news to only include articles that mention the ticker or company name
    const symbolLower = symbol.toLowerCase();
    const relevantNews = data.filter((item: any) => {
      const headline = (item.headline || "").toLowerCase();
      const summary = (item.summary || "").toLowerCase();
      const text = headline + " " + summary;
      
      // Check if the article mentions the ticker symbol or company name
      const mentionsTicker = text.includes(symbolLower) || 
        headline.includes(symbol) || 
        summary.includes(symbol);
      const mentionsCompany = companyName && (
        text.includes(companyName) ||
        text.includes(companyName.split(" ")[0]) // First word of company name (e.g., "Apple" from "Apple Inc")
      );
      
      return mentionsTicker || mentionsCompany;
    });

    return relevantNews.slice(0, limit).map((item: any) => ({
      id: item.id,
      headline: item.headline || "",
      summary: item.summary || "",
      source: item.source || "",
      url: item.url || "",
      image: item.image || null,
      datetime: item.datetime,
      related: item.related || symbol,
    }));
  } catch (error) {
    console.error("Error fetching company news:", error);
    return [];
  }
}

export async function getStockDetail(symbol: string): Promise<StockDetail | null> {
  try {
    const [quote, metrics, priceHistory, analystRatings, zacksRating, news] = await Promise.all([
      getQuote(symbol),
      getMetrics(symbol),
      getPriceHistory(symbol, 1825), // 5 years of data for all chart ranges
      getAnalystRatings(symbol),
      getZacksRating(symbol),
      getCompanyNews(symbol, 3),
    ]);

    if (!quote) {
      return null;
    }

    const macd = calculateMACD(priceHistory);
    const technicalIndicators = calculateTechnicalIndicators(priceHistory);

    return {
      quote,
      metrics,
      priceHistory,
      macd,
      technicalIndicators,
      analystRatings,
      zacksRating,
      news,
    };
  } catch (error) {
    console.error("Error fetching stock detail:", error);
    return null;
  }
}
