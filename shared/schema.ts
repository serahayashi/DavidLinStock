import { z } from "zod";

export const stockQuoteSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  high: z.number(),
  low: z.number(),
  open: z.number(),
  previousClose: z.number(),
  timestamp: z.number(),
});

export type StockQuote = z.infer<typeof stockQuoteSchema>;

export const stockMetricsSchema = z.object({
  symbol: z.string(),
  peRatio: z.number().nullable(),
  marketCap: z.number().nullable(),
  beta: z.number().nullable(),
  dividendYield: z.number().nullable(),
  eps: z.number().nullable(),
  high52Week: z.number().nullable(),
  low52Week: z.number().nullable(),
});

export type StockMetrics = z.infer<typeof stockMetricsSchema>;

export const priceHistoryPointSchema = z.object({
  date: z.string(),
  close: z.number(),
  high: z.number(),
  low: z.number(),
  open: z.number(),
  volume: z.number(),
});

export type PriceHistoryPoint = z.infer<typeof priceHistoryPointSchema>;

export const macdDataSchema = z.object({
  date: z.string(),
  macd: z.number(),
  signal: z.number(),
  histogram: z.number(),
});

export type MACDData = z.infer<typeof macdDataSchema>;

export const analystRatingSchema = z.object({
  symbol: z.string(),
  strongBuy: z.number(),
  buy: z.number(),
  hold: z.number(),
  sell: z.number(),
  strongSell: z.number(),
  totalAnalysts: z.number(),
});

export type AnalystRating = z.infer<typeof analystRatingSchema>;

export const stockSearchResultSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  type: z.string(),
});

export type StockSearchResult = z.infer<typeof stockSearchResultSchema>;

export const watchlistItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  symbol: z.string(),
  addedAt: z.number(),
});

export type WatchlistItem = z.infer<typeof watchlistItemSchema>;

export const insertWatchlistItemSchema = watchlistItemSchema.omit({ id: true, addedAt: true });
export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;

export const zacksRatingSchema = z.object({
  symbol: z.string(),
  rank: z.number().min(1).max(5),
  rankText: z.string(),
  updatedAt: z.string().nullable(),
});

export type ZacksRating = z.infer<typeof zacksRatingSchema>;

export const stockDetailSchema = z.object({
  quote: stockQuoteSchema,
  metrics: stockMetricsSchema,
  priceHistory: z.array(priceHistoryPointSchema),
  macd: z.array(macdDataSchema),
  analystRatings: analystRatingSchema.nullable(),
  zacksRating: zacksRatingSchema.nullable(),
});

export type StockDetail = z.infer<typeof stockDetailSchema>;
