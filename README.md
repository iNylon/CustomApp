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

## Betrouwbare verwerking bij piekbelasting

De collector is nu expliciet ingericht om tijdelijke exportproblemen naar OpenObserve op te vangen:

- `retry_on_failure` staat aan op alle O2-exporters in [`otel-collector-config.yaml`](/Users/dylan/CustomApp/otel-collector-config.yaml)
- `sending_queue` staat aan op alle O2-exporters in [`otel-collector-config.yaml`](/Users/dylan/CustomApp/otel-collector-config.yaml)
- de exporter-queue gebruikt persistente opslag via `file_storage`, ook in [`otel-collector-config.yaml`](/Users/dylan/CustomApp/otel-collector-config.yaml)
- de collector bewaart deze queue op de volume mount `otelcol-file-storage` in [`docker-compose.yml`](/Users/dylan/CustomApp/docker-compose.yml)
- export naar OpenObserve loopt via een lokale relay `o2-relay` in [`docker-compose.yml`](/Users/dylan/CustomApp/docker-compose.yml), zodat je storingen reproduceerbaar kunt simuleren zonder de collector uit te zetten

Daarnaast exposeert de collector nu eigen Prometheus-metrics op `http://localhost:8888/metrics`. Daardoor kun je queue-groei en herstel zichtbaar maken via metrics zoals:

- `otelcol_exporter_queue_size`
- `otelcol_exporter_queue_capacity`
- `otelcol_exporter_send_failed_*`
- `otelcol_exporter_sent_*`

## Loadtest voor queue-opbouw en herstel

Er is een reproduceerbare test toegevoegd in [`run-collector-resilience-test.sh`](/Users/dylan/CustomApp/scripts/run-collector-resilience-test.sh).

Deze test:

- start de stack
- start een headless Locust-loadtest
- stopt tijdelijk `o2-relay` zodat export naar OpenObserve faalt terwijl de collector wel data blijft ontvangen
- maakt collector-metric-snapshots voor, tijdens en na de storing
- start `o2-relay` weer
- wacht tot de exporter-queue is leeggelopen

Uitvoeren:

```bash
chmod +x ./scripts/run-collector-resilience-test.sh
./scripts/run-collector-resilience-test.sh
```

Optionele tuning:

```bash
USERS=200 SPAWN_RATE=40 TEST_DURATION=240s OUTAGE_AFTER_SECONDS=20 OUTAGE_DURATION_SECONDS=60 ./scripts/run-collector-resilience-test.sh
```

Resultaat:

- Locust-output komt in `./artifacts/collector-resilience/locust.log`
- collector-metric-snapshots komen in `./artifacts/collector-resilience/*.prom`

Daarmee kun je aantonen:

- dat de queue tijdens de storing oploopt
- dat export tijdelijk faalt zonder dat de collector direct stopt met accepteren
- dat de queue na herstel weer leegloopt
- dat telemetrie later alsnog naar OpenObserve wordt afgeleverd

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
- Alle runtimes labelen metrics, traces en logs nu ook met `customapp_measurement_run`, `customapp_apm_enabled` en `customapp_apm_profile`.

## Synthetische RUM-sessies

Locust gebruikt in deze repo `HttpUser` en genereert daardoor geen echte browser-RUM sessies. Daarom is er een aparte service toegevoegd:

- `rum-browser-runner`: een Playwright-gebaseerde synthetic browser runner

Deze service:

- laadt `/` en `/auth` als echte browserpagina's
- voert UI-interacties uit zoals inloggen, zoeken, filteren, producten toevoegen en meerdere checkouts doen
- zet een herkenbare synthetic user context via de bestaande browser-RUM integratie
- kan periodiek faults en de knop `Genereer RUM error` triggeren

Belangrijkste compose-instellingen in [docker-compose.yml](/Users/dylan/CustomApp/docker-compose.yml):

- `LOCUST_UI_URL`: Locust web UI endpoint dat `state` en `user_count` levert
- `BROWSER_CONCURRENCY`: maximum aantal parallelle browser workers
- `BROWSER_USERS_PER_WORKER`: hoeveel Locust users ongeveer overeenkomen met 1 browser worker
- `LOCUST_POLL_INTERVAL_MS`: hoe vaak de browser-runner Locust bevraagt
- `SESSION_INTERVAL_MS`: wachttijd tussen synthetische sessies per worker
- `SESSION_DURATION_MS`: extra tijd om RUM events te laten flushen
- `RUM_ERROR_EVERY_N`: genereert browser-errors; standaard staat deze op `1`, dus elke synthetische sessie klikt de RUM error knop
- `RUM_ERROR_DELAY_MS`: wachttijd binnen de sessie voordat op de RUM error knop wordt geklikt
- `FAULT_EVERY_N`: genereert periodiek backend/application faults via de UI
- `RUM_LOGIN_EMAIL` en `RUM_LOGIN_PASSWORD`: credentials voor de synthetic browser user

In OpenObserve RUM kun je deze sessies herkennen via de synthetic user context:

- e-mailformaat: `synthetic-rum+<session>@example.local`
- naamformaat: `Synthetic Browser <worker>`

Daardoor kun je echte browsergedreven RUM-data bekijken naast de backend-load uit Locust.
De runner schaalt nu ook terug naar nul als Locust niet actief is of `user_count = 0`, zodat er niet los van Locust browser-sessies blijven binnenkomen.

## APM-impact meten in Grafana

Voor de requirement "De APM-oplossing moet inzicht bieden in de impact van monitoring op resourcegebruik van de applicatie" kun je nu twee meetruns uitvoeren met dezelfde load:

- zonder APM: `CUSTOMAPP_MEASUREMENT_RUN=baseline-no-apm CUSTOMAPP_APM_ENABLED=false CUSTOMAPP_APM_PROFILE=without-apm docker compose up --build`
- met APM: `CUSTOMAPP_MEASUREMENT_RUN=apm-on CUSTOMAPP_APM_ENABLED=true CUSTOMAPP_APM_PROFILE=with-apm docker compose up --build`

Bij de run zonder APM worden app-traces, app-metrics en RUM bewust niet verstuurd. De vergelijking in Grafana gebeurt daarom via onafhankelijke container-metrics uit `cAdvisor`, die door de OpenTelemetry Collector naar `poc-metrics` worden gestuurd.

Het dashboard [`grafana/customapp-observability-deep-dive.json`](/Users/dylan/CustomApp/grafana/customapp-observability-deep-dive.json) bevat hiervoor een aparte sectie `APM Impact` met:

- app CPU nu, baseline en verschil
- app memory nu, baseline en verschil
- tijdseries voor CPU en memory nu versus baseline
- per-service vergelijking op container CPU en container memory

Gebruik in Grafana de variable `Baseline Offset` om de huidige APM-run te vergelijken met de eerdere baseline-run, bijvoorbeeld `1h` of `6h` terug.

Daardoor kun je in één dashboard zichtbaar maken of extra monitoring leidt tot hoger resourcegebruik van de applicatie, ook als de baseline-run zelf geen app-telemetrie verstuurt.

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
