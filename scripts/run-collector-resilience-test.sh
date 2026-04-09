#!/usr/bin/env bash

set -euo pipefail

USERS="${USERS:-120}"
SPAWN_RATE="${SPAWN_RATE:-20}"
TEST_DURATION="${TEST_DURATION:-180s}"
OUTAGE_AFTER_SECONDS="${OUTAGE_AFTER_SECONDS:-30}"
OUTAGE_DURATION_SECONDS="${OUTAGE_DURATION_SECONDS:-45}"
RESULT_DIR="${RESULT_DIR:-./artifacts/collector-resilience}"
METRICS_URL="${METRICS_URL:-http://localhost:8888/metrics}"

mkdir -p "${RESULT_DIR}"

snapshot_metrics() {
  local label="$1"
  local target_file="${RESULT_DIR}/${label}.prom"
  curl -fsS "${METRICS_URL}" > "${target_file}"
  echo "Saved collector metrics snapshot: ${target_file}"
}

print_queue_summary() {
  local label="$1"
  local target_file="${RESULT_DIR}/${label}.prom"
  echo "==== ${label} ===="
  grep -E 'otelcol_exporter_(queue_size|queue_capacity|enqueue_failed_|send_failed_|sent_)' "${target_file}" || true
}

wait_for_health() {
  until curl -fsS http://localhost:13133/ >/dev/null; do
    sleep 2
  done
}

wait_for_queue_drain() {
  local attempts="${1:-60}"
  local sleep_seconds="${2:-5}"

  for _ in $(seq 1 "${attempts}"); do
    curl -fsS "${METRICS_URL}" > "${RESULT_DIR}/queue-drain-check.prom"
    if ! grep -E '^otelcol_exporter_queue_size' "${RESULT_DIR}/queue-drain-check.prom" | grep -vq ' 0$'; then
      echo "Collector queue drained."
      return 0
    fi
    sleep "${sleep_seconds}"
  done

  echo "Collector queue did not drain within the expected time window." >&2
  return 1
}

echo "Starting stack for collector resilience test..."
docker compose up -d --build
wait_for_health
snapshot_metrics before-load

echo "Starting headless Locust load test in the background..."
docker compose run --rm --no-deps load-generator \
  locust -f /app/locustfile.py \
  --host http://php-storefront:8080 \
  --headless \
  -u "${USERS}" \
  -r "${SPAWN_RATE}" \
  -t "${TEST_DURATION}" \
  --only-summary > "${RESULT_DIR}/locust.log" 2>&1 &
LOADTEST_PID=$!

sleep "${OUTAGE_AFTER_SECONDS}"
snapshot_metrics before-outage

echo "Simulating OpenObserve outage by stopping the relay..."
docker compose stop o2-relay
sleep "${OUTAGE_DURATION_SECONDS}"
snapshot_metrics during-outage
print_queue_summary during-outage

echo "Restoring OpenObserve relay..."
docker compose up -d o2-relay
sleep 15
snapshot_metrics after-restore
print_queue_summary after-restore

echo "Waiting for load test to finish..."
wait "${LOADTEST_PID}"

wait_for_queue_drain
snapshot_metrics after-drain
print_queue_summary after-drain

echo "Collector resilience test completed."
echo "Artifacts saved in ${RESULT_DIR}"
