---
name: Reachable market data APIs from Replit
description: Which public market data APIs work vs. are blocked when called from Replit servers
---

# Market API reachability from Replit (tested June 2026)

## WORKING ✓
- **OKX public API** — funding rate, open interest, tickers. No key, no geo-block.
  - `https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP`
  - `https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=BTC-USDT-SWAP`
- **Coinbase Exchange ticker** — `https://api.exchange.coinbase.com/products/BTC-USD/ticker`. No key.
- **Open Exchange Rates (free tier)** — `https://open.er-api.com/v6/latest/USD`. Covers EUR/USD and USD/CNY in one call.
- **CBOE VIX History CSV** — `https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv`. Daily close, no key.
- **Yahoo Finance v8 chart API** — REQUIRES `Referer: https://finance.yahoo.com/` header or returns 429.
  - Works for: `^TNX`, `QQQ`, `CL=F` (WTI), and most symbols
  - URL: `https://query2.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d`

## BLOCKED ✗
- **Binance** — HTTP 451 (Unavailable For Legal Reasons, CloudFront geo-block)
- **Bybit** — HTTP 200 but returns `{error: The Amazon CloudFront distribution is configured to block access from your country}`
- **Yahoo Finance without Referer** — returns `Too Many Requests` (429)
- **FRED API (stlouisfed.org)** — connection times out from Replit
- **Treasury FiscalData API** — base URL returns 404; correct path unclear, also times out
- **Stooq.com** — returns 404 for all symbol queries

**Why:** Binance/Bybit use CloudFront with US/data-center IP geo-restriction. FRED and Treasury are slow/unreachable. Yahoo Finance requires browser-like Referer to avoid rate limit.

**How to apply:** For BTC futures/OI/funding, use OKX. For traditional market data (equities, VIX), use Yahoo Finance v8 with Referer header. For FX, use open.er-api.com. Never use Binance or Bybit from server-side code.
