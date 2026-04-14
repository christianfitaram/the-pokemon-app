# Observability Setup

## Metrics Backend

`lib/observability.ts` supports exporting metrics to StatsD-compatible backends
(Datadog Agent, Telegraf, Prometheus StatsD exporter) using UDP.

Environment variables:

- `METRICS_BACKEND=statsd`
- `STATSD_HOST=<agent-host>`
- `STATSD_PORT=8125` (optional, defaults to `8125`)
- `METRICS_PREFIX=pokemon_app` (optional)

## Metrics Emitted

- Counter metrics from `incrementCounter(...)`
  - Example: `pokemon_app.api.assistance.success`
  - Example: `pokemon_app.api.assistance.errors`
  - Example: `pokemon_app.api.chat_roleplay.aborts`
  - Example: `pokemon_app.api.chat_roleplay.stream_errors`
  - Example: `pokemon_app.api.chat_roleplay.context_errors`
- Route latency histograms (milliseconds) via `observeDuration(...)`
  - `pokemon_app.api.assistance.duration_ms`
  - `pokemon_app.api.chat_roleplay.duration_ms`
  - `pokemon_app.api.pokemons.enriched.duration_ms`

Each latency metric includes an `outcome` tag (`success` or `error`).

Metrics are sent only when `METRICS_BACKEND=statsd` or `STATSD_HOST` is configured.

## Suggested Alerts

Use these as starting thresholds and tune per real traffic baseline:

1. `p95` latency alert (`api.assistance`)
   - Trigger when `p95:pokemon_app.api.assistance.duration_ms{outcome:success} > 1500` for 5 minutes.

2. `p99` latency alert (`api.chat_roleplay`)
   - Trigger when `p99:pokemon_app.api.chat_roleplay.duration_ms{outcome:success} > 3000` for 5 minutes.

3. Error-rate alert (`api.assistance`)
   - Trigger when
     `sum: pokemon_app.api.assistance.errors / (sum: pokemon_app.api.assistance.success + sum: pokemon_app.api.assistance.errors) > 0.05`
     for 10 minutes.

4. Error-rate alert (`api.pokemons.enriched`)
   - Trigger when
     `sum: pokemon_app.api.pokemons.enriched.errors / (sum: pokemon_app.api.pokemons.enriched.success + sum: pokemon_app.api.pokemons.enriched.errors) > 0.03`
     for 10 minutes.
