# Tasks: Global ETF Analyzer Platform

## Phase 1: Foundation

- [ ] Task 1: Create project structure with HTML, CSS, JS directories and index.html skeleton
- [ ] Task 2: Implement industrial HMI CSS design system with amber/green/red/cyan palette
- [ ] Task 3: Set up IndexedDB storage wrapper with portfolio and watchlist tables
- [ ] Task 4: Create basic navigation and layout with drawer components
- [ ] Task 5: Implement responsive grid system for dashboard layout

## Checkpoint: Foundation
- [ ] Project builds without errors
- [ ] Navigation works in all drawers
- [ ] Storage operations (read/write) work correctly
- [ ] Responsive layout renders properly on all screen sizes

## Phase 2: Core Dashboard (KPIs and Overview)

- [ ] Task 6: Fetch and display real-time ETF prices for top 10 global ETFs
- [ ] Task 7: Implement portfolio value display with Total, Daily Change, YTD, and Total Return KPIs
- [ ] Task 8: Create portfolio allocation charts (pie, donut, bar)
- [ ] Task 9: Implement daily price change indicators (green/red colors)
- [ ] Task 10: Add portfolio composition breakdown by sector/region

## Checkpoint: Core Dashboard
- [ ] All KPIs update correctly with real data
- [ ] Charts render and animate properly
- [ ] Color coding matches market movement (green/red)
- [ ] Responsive charts on mobile devices

## Phase 3: ETF Selection and Analysis

- [ ] Task 11: Build ETF search and filter interface with 50+ global ETF options
- [ ] Task 12: Implement technical analysis view for selected ETF (1, 3, 6 month charts)
- [ ] Task 13: Add key metrics display (P/E ratio, volume, AUM, expense ratio)
- [ ] Task 14: Implement moving averages overlay on price charts (20, 50, 200 day)
- [ ] Task 15: Add Bollinger Bands indicator visualization

## Checkpoint: ETF Analysis
- [ ] ETF search returns results in < 2 seconds
- [ ] Technical indicators render correctly
- [ ] Multiple timeframes switch without data loss
- [ ] Metrics update with real-time price changes

## Phase 4: Portfolio Management

- [ ] Task 16: Implement add holdings to portfolio workflow
- [ ] Task 17: Create portfolio holdings table with real-time P&L
- [ ] Task 18: Implement quantity and price editing for holdings
- [ ] Task 19: Implement portfolio rebalancing suggestions with threshold alerts
- [ ] Task 20: Implement watchlist management (add/remove items)

## Checkpoint: Portfolio Management
- [ ] Portfolio holds can be added and updated
- [ ] P&L calculations accurate to 2 decimal places
- [ ] Rebalancing alerts trigger at 10%, 20%, 30% thresholds
- [ ] Watchlist items persist and sync with portfolio

## Phase 5: Risk Analysis and Optimization

- [ ] Task 21: Implement risk metrics calculation (Sharpe ratio, volatility, max drawdown)
- [ ] Task 22: Create efficient frontier visualization with portfolio optimization
- [ ] Task 23: Add mean-variance optimization algorithm for portfolio allocation
- [ ] Task 24: Implement risk tolerance assessment wizard (conservative/moderate/aggressive)
- [ ] Task 25: Add VaR and CVaR (conditional VaR) calculations with 95% and 99% confidence

## Checkpoint: Risk Analysis
- [ ] Risk metrics update with portfolio changes
- [ ] Efficient frontier renders with 5-10 optimization points
- [ ] Portfolio optimizer suggests realistic allocations
- [ ] Risk tolerance profile affects recommendations

## Phase 6: Technical Indicators and Scanning

- [ ] Task 26: Implement RSI (Relative Strength Index) indicator calculation
- [ ] Task 27: Add MACD (Moving Average Convergence Divergence) indicator
- [ ] Task 28: Create ETF scanner with buy/sell signals based on indicators
- [ ] Task 29: Implement volume analysis and price-volume correlation
- [ ] Task 30: Add price alerts for target price triggers

## Checkpoint: Technical Indicators
- [ ] RSI values between 0-100 with overbought/oversold zones
- [ ] MACD shows crossovers correctly
- [ ] Scanner identifies ETFs with buy signals
- [ ] Price alerts notify at thresholds

## Phase 7: Global Macro and News

- [ ] Task 31: Fetch global macro indicators (GDP, inflation, interest rates)
- [ ] Task 32: Implement currency exchange rate dashboard
- [ ] Task 33: Add financial news aggregation from 10+ sources
- [ ] Task 34: Create sentiment analysis dashboard with sentiment scores
- [ ] Task 35: Add economic calendar with important events

## Checkpoint: Macro and News
- [ ] Macro data updates daily at market open
- [ ] Exchange rates sync every 5 minutes
- [ ] News headlines update in real-time
- [ ] Sentiment scores calculated from news headlines

## Phase 8: PDF Export and Reporting

- [ ] Task 36: Implement PDF report generation with jsPDF
- [ ] Task 37: Create portfolio summary report template
- [ ] Task 38: Add optimization results export
- [ ] Task 39: Implement technical analysis report export
- [ ] Task 40: Add scheduled PDF delivery option

## Checkpoint: PDF Export
- [ ] PDFs generate without errors
- [ ] Reports include all requested sections
- [ ] Formatting matches industrial HMI design
- [ ] File downloads complete successfully

## Phase 9: Testing and Polish

- [ ] Task 41: Implement comprehensive error handling for API failures
- [ ] Task 42: Add loading states and skeleton screens
- [ ] Task 43: Implement offline mode with cached data
- [ ] Task 44: Add keyboard shortcuts for power users
- [ ] Task 45: Performance optimization and bundle size reduction

## Checkpoint: Production Ready
- [ ] Application handles API failures gracefully
- [ ] Loading states clear and informative
- [ ] Offline mode works with cached data
- [ ] Performance meets < 3 second initial load target
