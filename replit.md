# StockLens - Stock Research Made Simple

## Overview
StockLens is a cross-platform stock information app that aggregates analyst ratings from brokerage firms and presents them in a simple, searchable interface. Users can look up any supported stock by ticker, view key metrics (latest price, P/E ratio, recent price history, MACD), comprehensive technical indicators, and save stocks to their personal watchlist.

## Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, Shadcn UI, Recharts
- **Backend**: Express.js, Node.js
- **Data Sources**: 
  - Finnhub API - Real-time quotes, metrics, analyst ratings, news
  - Yahoo Finance (yahoo-finance2 v3) - Historical price data (primary)
  - Alpha Vantage - Historical price fallback
  - Zacks API - Stock rankings
- **Storage**: In-memory (MemStorage)

## Project Structure
```
client/
  src/
    components/        # Reusable UI components
      analyst-ratings.tsx
      header.tsx
      macd-chart.tsx
      metric-card.tsx
      price-change.tsx
      price-chart.tsx
      stock-news.tsx
      stock-search.tsx
      technical-analysis.tsx
      theme-provider.tsx
      theme-toggle.tsx
      watchlist-button.tsx
      watchlist-card.tsx
    pages/             # Route pages
      home.tsx
      stock-detail.tsx
      watchlist.tsx
      not-found.tsx
    lib/
      userId.ts        # UUID generation for anonymous users
      queryClient.ts   # React Query configuration
server/
  finnhub.ts          # Multi-source API integration (Finnhub, Yahoo Finance, Alpha Vantage, Zacks)
  routes.ts           # API endpoints
  storage.ts          # Watchlist storage
shared/
  schema.ts           # Shared TypeScript types and Zod schemas
```

## Key Features
1. **Stock Search**: Autocomplete search by ticker symbol
2. **Stock Detail**: Price, P/E ratio, market cap, 52-week range, beta, EPS
3. **Price Charts**: 30/90/180-day interactive price history charts (Yahoo Finance)
4. **MACD Indicator**: Technical analysis with MACD, signal line, histogram
5. **Technical Analysis**: RSI (14-period), Moving Averages (20/50/200), Bollinger Bands, ATR, Momentum
6. **Analyst Ratings**: Aggregated Buy/Sell ratings from analysts
7. **Zacks Rating**: 1-5 scale rating (Strong Buy to Strong Sell)
8. **Latest News**: 3 most recent news articles filtered by relevance (mentions ticker/company name)
9. **Watchlist Table**: Table view with sortable columns (price, change, P/E, Zacks)
10. **Watchlist Cards**: Alternative card view for watchlist
11. **Dark Mode**: System/light/dark theme support

## API Endpoints
- `GET /api/stocks/search?query={ticker}` - Search stocks
- `GET /api/stocks/{symbol}` - Get full stock details
- `GET /api/stocks/{symbol}/quote` - Get quote only
- `GET /api/watchlist/{userId}` - Get user's watchlist
- `POST /api/watchlist/{userId}` - Add stock to watchlist
- `DELETE /api/watchlist/{userId}/{symbol}` - Remove from watchlist

## Environment Variables
- `FINNHUB_API_KEY` - Required for real-time quotes, metrics, analyst ratings, and news
- `ALPHA_VANTAGE_API_KEY` - Fallback for price history if Yahoo Finance fails

## Data Strategy
- **Primary**: Yahoo Finance for historical price data (no rate limits, reliable)
- **Secondary**: Finnhub candle API for price data if Yahoo fails
- **Tertiary**: Alpha Vantage as last resort fallback
- **Real-time**: Finnhub API for current quotes, metrics, analyst ratings
- **Rankings**: Zacks API for stock ratings (1-5 scale)

## Technical Indicators (Calculated Server-side)
- **RSI**: 14-period Relative Strength Index with overbought/oversold signals
- **Moving Averages**: SMA 20, 50, and 200-day periods
- **Bollinger Bands**: 20-period with 2 standard deviation
- **ATR**: 14-period Average True Range for volatility
- **Momentum**: 10-period price momentum indicator
- **MACD**: 12/26/9 period MACD with signal line and histogram

## Running the Project
The application runs on port 5000 with `npm run dev`. This starts both the Express backend and Vite frontend.
