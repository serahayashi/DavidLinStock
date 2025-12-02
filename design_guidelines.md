# StockLens Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from modern fintech leaders - Robinhood's clean, accessible interface + TradingView's data visualization excellence + Bloomberg's professional information density. This creates a trustworthy, data-focused experience suitable for both teens and serious market observers.

**Core Principle**: Clarity over decoration. Every element serves the data.

---

## Typography System

**Font Family**: Inter (via Google Fonts) - exceptional readability for financial data
- Primary: Inter (400, 500, 600, 700)
- Monospace: JetBrains Mono for ticker symbols and prices

**Hierarchy**:
- Stock prices: text-4xl/text-5xl, font-bold, tabular-nums
- Ticker symbols: text-2xl, font-semibold, uppercase, tracking-wide
- Section headers: text-xl, font-semibold
- Data labels: text-sm, font-medium, uppercase, tracking-wider
- Metric values: text-lg, font-semibold, tabular-nums
- Body/descriptions: text-base, font-normal
- Timestamps/metadata: text-xs, font-normal

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistency
- Component padding: p-4 (mobile), p-6 (tablet), p-8 (desktop)
- Section spacing: space-y-8 (mobile), space-y-12 (desktop)
- Card gaps: gap-4 (tight), gap-6 (standard), gap-8 (loose)

**Grid System**:
- Max container width: max-w-7xl mx-auto
- Search/Stock detail: max-w-4xl mx-auto
- Watchlist grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

---

## Component Library

### Navigation
- Fixed top nav: h-16, backdrop-blur-md with subtle border-b
- Left: App logo/name (text-xl font-bold)
- Center: Search bar (max-w-md, prominent placement)
- Right: Watchlist icon with count badge

### Search Component
- Prominent search bar: h-12, rounded-xl
- Autocomplete dropdown: absolute positioning, max-h-80 overflow-y-auto
- Ticker suggestions: Hover states, ticker in monospace, company name in regular
- "No results" state with helpful suggestions

### Stock Detail Page
**Hero Section** (NOT full viewport):
- Ticker + Company name header: py-8
- Price display: Large, bold, with +/- change indicator and percentage
- Timestamp: Small, muted
- Quick actions: "Add to Watchlist" button (prominent)

**Data Grid** (multi-column on desktop):
```
Desktop: 2-column layout (60/40 split)
Left: Charts and primary metrics
Right: Key stats sidebar (P/E, Market Cap, Volume, etc.)
```

**Chart Section**:
- Tab navigation for timeframes: 30D, 90D, 180D (horizontal pills)
- Chart canvas: min-h-80, responsive scaling
- MACD below price chart: min-h-48
- Tooltip on hover with precise values

**Metrics Cards**:
- Grid of metric cards: bg-subtle, rounded-lg, p-6
- Label above value layout
- Info icon tooltip for explanations (non-advisory)
- Dividers between metric groups

### Watchlist
- Card-based grid layout
- Each card: Stock ticker (large), current price, % change, mini sparkline chart
- Quick remove action (icon button, top-right)
- Empty state: Centered illustration + "Start adding stocks" CTA

### Data Display Components
**Stat Card**:
- Clean card: rounded-lg, border, p-6
- Label: text-sm, uppercase, tracking-wider, font-medium
- Value: text-2xl, font-bold, tabular-nums
- Optional: Small trend indicator (↑/↓)

**Analyst Ratings Breakdown**:
- Horizontal bar chart showing rating distribution
- Rating labels: Strong Buy, Buy, Hold, Sell
- Count/percentage for each category
- Total analyst count displayed prominently

**Price Change Indicator**:
- Inline badge style
- Positive: Green-tinted (text and background tint)
- Negative: Red-tinted
- Format: "+$2.45 (+1.23%)" or "-$1.10 (-0.54%)"

### Buttons & Actions
**Primary CTA**: "Add to Watchlist"
- px-6 py-3, rounded-lg, font-semibold
- Filled style for primary actions
- Icon + text combination

**Secondary**: Outlined buttons for chart controls
**Icon buttons**: For remove actions, info tooltips

### Charts
- Use Chart.js or Recharts
- Clean grid lines, subtle
- Crosshair on hover
- Responsive tooltip with exact values
- Time axis at bottom, price axis at right
- MACD: Two-line chart with histogram bars

---

## Page Layouts

### Home/Landing Page
1. **Hero** (NOT 100vh): Centered search + tagline, py-20
2. **How It Works**: 3-column grid explaining features
3. **Popular Stocks**: Horizontal scrollable carousel
4. **CTA Section**: "Start Tracking Stocks" with search

### Stock Detail Page
- Full-width layout
- Sticky header with ticker + price as you scroll
- Main content: 2-column on lg+, stacked on mobile
- Related stocks section at bottom

### Watchlist Page
- Page header: "My Watchlist" + stock count
- Grid of stock cards
- Sort/filter controls (optional)

---

## Responsive Behavior
- Mobile-first approach
- Charts: Full-width on mobile, constrained on desktop
- Data grids: Stack to single column on mobile
- Search: Expand to full-width on mobile focus

---

## Micro-interactions
**Minimal animation budget**:
- Hover states on cards: subtle scale (scale-[1.02])
- Chart tooltip: Fade in/out
- Loading states: Skeleton screens for data, spinner for charts
- Tab switches: Smooth transition-opacity
- Add to watchlist: Success checkmark animation (brief)

**NO** scroll-triggered animations, parallax, or decorative effects

---

## Images Section
**Hero Image**: Yes - abstract financial/data visualization artwork
- Placement: Background of hero section with gradient overlay
- Style: Modern, geometric, network visualization or abstract stock chart patterns
- Treatment: Blur overlay for text legibility, buttons with backdrop-blur-sm

**Empty States**:
- Watchlist empty state: Simple line illustration (magnifying glass over charts)
- No search results: Friendly icon illustration

**Trust Indicators** (optional):
- Small logos/badges of data sources in footer

---

## Error & Edge States
- Invalid ticker: Inline error message below search
- Loading: Skeleton screens matching final layout
- API failure: Friendly error card with retry button
- Stale data warning: Small banner with last update time