# GoldRush Pipeline Playbook

This playbook is the Phase 3 starter for moving from request/response analytics to continuously delivered analytics-ready data.

## Target Outcome

- Stream structured blockchain data into your own destination.
- Keep MCP tools lightweight while heavy aggregation runs downstream.
- Enable dashboarding/alerting on top of the same normalized data.

## Recommended First Pipeline

- **Source chain:** Solana
- **Use case:** DEX + transfer surveillance for whale intelligence
- **Destination:** ClickHouse or Postgres
- **Initial scope:** top holder wallets + monitored mints only

## Suggested Rollout

1. Start with one destination and one narrow stream.
2. Backfill and validate schema consistency for 7 days.
3. Build one materialized view for concentration + netflow.
4. Wire one alert class (e.g., abrupt top-holder net selling).
5. Expand coverage after latency and cost baselines stabilize.

## Operational Checklist

- Define data freshness SLO (e.g., p95 under 10s).
- Define replay/recovery process for destination outages.
- Add idempotency key strategy for webhook/queue sinks.
- Track ingestion lag and dropped-record metrics.
- Version schemas and maintain changelog for downstream consumers.

## Integration with mcgold

- Keep `src/tools/trace-whale-activity.ts` as online scoring path.
- Add a future `pipeline-backed` mode that reads from pre-aggregated tables.
- Preserve current fallback logic (`GoldRush` + `Helius`) until pipeline parity is proven.
