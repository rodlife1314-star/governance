---
name: Yahoo Finance symbol quirks
description: Which Yahoo Finance symbols work reliably from Replit, and how to handle volume unit conversion.
---

## Reliable symbols (tested working)

- `GC=F` — CME Gold Futures (front month) — use as primary XAU price reference
- `SI=F` — CME Silver Futures — use as primary XAG price reference
- `^NDX` — NASDAQ 100 cash index
- `NQ=F` — E-mini NASDAQ 100 futures
- `^DJI` — Dow Jones Industrial Average cash index
- `YM=F` — E-mini DJIA mini futures
- `GLD` — SPDR Gold ETF (tracks gold spot, ~0.0931 oz/share)

## Unreliable / broken symbols

- `XAUUSD=X` — Gold/USD forex pair — returns null `regularMarketPrice` via chart API. Do not use.
- `XAGUSD=X` — Silver/USD forex pair — same issue. Do not use.

**Why:** Yahoo Finance chart API (`/v8/finance/chart/`) doesn't consistently serve forex cross-rate pairs. The CME futures symbols (GC=F, SI=F) are the industry standard reference prices anyway.

## Volume unit mismatch

`regularMarketVolume` from Yahoo Finance is in **contracts** (for futures) or **shares** (for ETFs/stocks), NOT in USD.

To get USD notional volume, multiply by the contract multiplier:

| Symbol | Multiplier | Meaning |
|--------|-----------|---------|
| GC=F   | 100       | 100 troy oz per contract |
| SI=F   | 5000      | 5000 troy oz per contract |
| NQ=F   | 20        | $20 per index point (E-mini NASDAQ) |
| YM=F   | 5         | $5 per index point (E-mini DJIA) |

Formula: `usdNotional = contracts × multiplier × refPrice`

**How to apply:** These multipliers live in `CONTRACT_MULTIPLIERS` in `artifacts/api-server/src/routes/sovereign.ts`. Always use this map when converting Yahoo Finance futures volume to USD notional.
