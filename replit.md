# StockLens - Stock Research Made Simple

## Overview
StockLens is a cross-platform stock information app that aggregates analyst ratings from brokerage firms and presents them in a simple, searchable interface. Users can look up any supported stock by ticker, view key metrics (latest price, P/E ratio, recent price history, MACD), and save stocks to their personal watchlist.

## Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, Shadcn UI, Recharts
- **Backend**: Express.js, Node.js
- **Data Source**: Finnhub API
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
      stock-search.tsx
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
  finnhub.ts          # Finnhub API integration
  routes.ts           # API endpoints
  storage.ts          # Watchlist storage
shared/
  schema.ts           # Shared TypeScript types and Zod schemas
```

## Key Features
1. **Stock Search**: Autocomplete search by ticker symbol
2. **Stock Detail**: Price, P/E ratio, market cap, 52-week range, beta, EPS
3. **Price Charts**: 30/90/180-day interactive price history charts
4. **MACD Indicator**: Technical analysis with MACD, signal line, histogram
5. **Analyst Ratings**: Aggregated Buy/Sell ratings from analysts
6. **Zacks Rating**: 1-5 scale rating (Strong Buy to Strong Sell)
7. **Latest News**: 3 most recent news articles for each stock
8. **Watchlist Table**: Table view with sortable columns (price, change, P/E, Zacks)
9. **Watchlist Cards**: Alternative card view for watchlist
10. **Dark Mode**: System/light/dark theme support

## API Endpoints
- `GET /api/stocks/search?query={ticker}` - Search stocks
- `GET /api/stocks/{symbol}` - Get full stock details
- `GET /api/stocks/{symbol}/quote` - Get quote only
- `GET /api/watchlist/{userId}` - Get user's watchlist
- `POST /api/watchlist/{userId}` - Add stock to watchlist
- `DELETE /api/watchlist/{userId}/{symbol}` - Remove from watchlist

## Environment Variables
- `FINNHUB_API_KEY` - Required for real-time quotes, metrics, and analyst ratings
- `ALPHA_VANTAGE_API_KEY` - Required for price history charts and MACD indicator

## Running the Project
The application runs on port 5000 with `npm run dev`. This starts both the Express backend and Vite frontend.
