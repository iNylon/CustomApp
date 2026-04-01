# OpenObserve OTEL PoC

Deze repo bevat een multi-service demo-app voor een OpenObserve PoC. De stack is bewust opgezet als een kleine observability-speeltuin met:

- `php-storefront` als hoofdapp
- `python-recommendation` voor PostgreSQL-gedreven aanbevelingen
- `node-catalog` voor MySQL-gedreven catalogusdata
- `java-checkout` voor checkout- en Redis-gerelateerde flows
- `mysql`, `postgres`, `redis`
- `otel-collector`
- `locust` als load generator

De app genereert bewust veel telemetrie:

- traces voor elke request en downstream call
- metrics voor requests, errors en latency
- JSON-logs via de collector
- foutpaden via chaos-endpoints en willekeurige errors

## Streams in OpenObserve

De collector stuurt signalen naar aparte streams:

- traces: `poc-traces`
- metrics: `poc-metrics`
- logs: `poc-logs`

Je kunt deze namen aanpassen in [`otel-collector-config.yaml`](/Users/dylan/CustomApp/otel-collector-config.yaml).

## Starten

```bash
docker compose up --build
```

Beschikbare endpoints:

- app: `http://localhost:8080`
- locust UI: `http://localhost:8089`
- collector health: `http://localhost:13133`

## Belangrijkste flows

- De PHP-app roept Node, Python en Java aan.
- Node leest productdata uit MySQL.
- Python leest user/recommendation data uit PostgreSQL en gebruikt Redis caching.
- Python draait ook een keepalive-flow die de storefront periodiek door auth, summary, checkout en fault-paden laat lopen zodat dashboards continu metrics blijven ontvangen.
- Java simuleert checkout- en payment-achtige flows met Redis en foutinjectie.
- Alle services schrijven structured logs naar `/var/telemetry-logs/*.log`, die door de collector worden ingelezen.

## RUM later inschakelen

De PHP-frontend bevat al een RUM-ready config endpoint. Zet later in `docker-compose.yml` bijvoorbeeld:

```yaml
APP_ENABLE_RUM: "true"
APP_RUM_CLIENT_TOKEN: "rumsc8iFvkD9574Idx7"
APP_RUM_APPLICATION_ID: "web-application-id"
APP_RUM_SITE: "openobserve.dylanp.nl"
APP_RUM_ORGANIZATION_IDENTIFIER: "3BTUvLGWaJI6cc5tC2JGlZTW1ea"
APP_RUM_SERVICE: "php-storefront-web"
APP_RUM_ENV: "poc"
APP_RUM_VERSION: "0.0.1"
APP_RUM_API_VERSION: "v1"
APP_RUM_INSECURE_HTTP: "false"
```

De frontend exposeert deze waarden via `/rum-config.js`, zodat je later eenvoudig de OpenObserve browser SDK kunt toevoegen.

## O2 verificatie (trace, logs, infra)

Na deployment van de laatste wijzigingen kun je in OpenObserve snel verifiëren:

1. `trace_id` en `request_id` aanwezig in logs.
2. Correlatie van trace naar logs.
3. Infrastructuurcomponenten zichtbaar in traces via `component.layer` en `infra.kind`.

Voorbeeld queries:

```sql
SELECT _timestamp, "service.name", trace_id, request_id, message
FROM "poc-logs"
WHERE _timestamp >= now() - INTERVAL '30 minutes'
ORDER BY _timestamp DESC
LIMIT 200;
```

```sql
SELECT _timestamp, trace_id, service_name, span_name, status_code, duration_ms, attributes
FROM "poc-traces"
WHERE _timestamp >= now() - INTERVAL '30 minutes'
	AND (
		attributes.component.layer = 'infrastructure'
		OR attributes.infra.kind IS NOT NULL
	)
ORDER BY _timestamp DESC
LIMIT 300;
```

```sql
SELECT _timestamp, "service.name", severity, message, trace_id, request_id, context
FROM "poc-logs"
WHERE _timestamp >= now() - INTERVAL '30 minutes'
	AND trace_id = '<trace_id_uit_traces>'
ORDER BY _timestamp DESC;
```
