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

## Monitoring-intensiteit centraal regelen

De intensiteit van telemetrie kun je centraal aanpassen in [`otel-collector-config.yaml`](/Users/dylan/CustomApp/otel-collector-config.yaml), zonder de app-services opnieuw te deployen:

- Traces: pas `processors.probabilistic_sampler/traces.sampling_percentage` aan.
- Logs: voeg regels toe onder `processors.filter/logs.logs.log_record` om logrecords centraal te filteren.
- Metrics: voeg regels toe onder `processors.filter/metrics.metrics.metric` om ruisende metrics centraal te droppen.
- Batching: tune `batch/traces`, `batch/logs` en `batch/metrics` per signaaltype.
- Collector-loglevel: pas `service.telemetry.logs.level` aan.

Voorbeelden:

- Meer trace-detail tijdens incidenten: zet `sampling_percentage: 100`
- Minder trace-volume in steady state: zet `sampling_percentage: 10`
- Minder log-volume: filter bijvoorbeeld `INFO`- of `DEBUG`-achtige records centraal
- Minder metric-volume: drop proces- of resource-metrics die je tijdelijk niet nodig hebt

Let op: in deze repo worden metrics nu via OTLP push verstuurd, niet via scrape. Daardoor regel je metric-intensiteit hier centraal via filters en batching, niet via een scrape interval. Als je specifiek het scrape interval wilt kunnen aanpassen, moeten de services eerst scrape-bare Prometheus metrics exposen en moet de collector of Prometheus die endpoints scrapen.

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
- De PHP-app bevat ook een synthetisch `/api/error` endpoint voor consistente 500-metrics en exception-logs.
- Alle runtimes sturen nu ook CPU- en geheugengebruik uit, inclusief process/service-context en threshold-logs voor resource-afwijkingen.
- Alle services schrijven structured logs naar `/var/telemetry-logs/*.log`, die door de collector worden ingelezen.
- Een Grafana-dashboard voor deze opzet staat in [`grafana/customapp-observability-deep-dive.json`](/Users/dylan/CustomApp/grafana/customapp-observability-deep-dive.json).
- Naast `load-generator` draait ook `rum-browser-runner`, een echte headless browser die synthetische storefront-sessies opbouwt zodat OpenObserve RUM sessies, interacties en browser-errors kan registreren.

## Synthetische RUM-sessies

Locust gebruikt in deze repo `HttpUser` en genereert daardoor geen echte browser-RUM sessies. Daarom is er een aparte service toegevoegd:

- `rum-browser-runner`: een Playwright-gebaseerde synthetic browser runner

Deze service:

- laadt `/` en `/auth` als echte browserpagina's
- voert UI-interacties uit zoals zoeken, filteren, producten toevoegen en checkout klikken
- zet een herkenbare synthetic user context via de bestaande browser-RUM integratie
- kan optioneel periodiek de knop `Genereer RUM error` klikken

Belangrijkste compose-instellingen in [docker-compose.yml](/Users/dylan/CustomApp/docker-compose.yml):

- `BROWSER_CONCURRENCY`: aantal parallelle browser workers
- `SESSION_INTERVAL_MS`: wachttijd tussen synthetische sessies per worker
- `SESSION_DURATION_MS`: extra tijd om RUM events te laten flushen
- `RUM_ERROR_EVERY_N`: zet op bijvoorbeeld `5` om elke vijfde sessie een browserfout te genereren

In OpenObserve RUM kun je deze sessies herkennen via de synthetic user context:

- e-mailformaat: `synthetic-rum+<session>@example.local`
- naamformaat: `Synthetic Browser <worker>`

Daardoor kun je echte browsergedreven RUM-data bekijken naast de backend-load uit Locust.

## Requirement: bottlenecks visueel inzichtelijk

Deze applicatie dekt de requirement "De APM-oplossing moet bottlenecks binnen requests of transacties visueel inzichtelijk maken" op de volgende manier:

- Elke request of transactie wordt als een trace met root span en child spans vastgelegd.
- Trage infrastructuurstappen worden als aparte child spans geregistreerd, zoals database-connecties, lock waits, query-loops, cache reads en cache writes.
- Bottleneck-spans krijgen expliciete attributen zoals `component.layer`, `infra.kind`, `db.system`, `db.operation`, `server.address`, `server.port` en `bottleneck.active`.
- Request- en componentduur worden ook als metrics vastgelegd, zodat latencypieken zowel in dashboards als in trace-waterfalls zichtbaar zijn.
- Logs bevatten `trace_id` en `span_id`, zodat je vanuit een trage span direct de gerelateerde logs kunt openen.

Daardoor kun je in OpenObserve of een andere APM-oplossing visueel zien:

- hoe een request uiteenvalt in een waterfall of trace tree
- welke stap het meeste tijd kost
- of de bottleneck in applicatielogica, MySQL, PostgreSQL of Redis zit
- welke bottlenecks synthetisch geactiveerd zijn via `bottleneck.active=true`

Voorbeelden in de code:

- PHP storefront child spans voor MySQL, PostgreSQL en Redis in [index.php](/Users/dylan/CustomApp/php-app/public/index.php)
- Node catalog child spans voor MySQL-queries en Redis-markers in [server.js](/Users/dylan/CustomApp/node-service/server.js)
- Python recommendation child spans voor PostgreSQL-queries en Redis-cacheacties in [app.py](/Users/dylan/CustomApp/python-service/app.py)
- Java checkout child spans voor Redis-acties in [App.java](/Users/dylan/CustomApp/java-service/src/main/java/nl/dylan/openobserve/App.java)

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
