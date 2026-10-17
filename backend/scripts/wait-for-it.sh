#!/usr/bin/env bash
# Waits for a TCP host:port to become available.
# Usage: ./wait-for-it.sh host:port -- command args

set -euo pipefail

TIMEOUT=60
HOST_PORT="$1"
shift
if [ "$1" = "--" ]; then shift; fi

HOST=$(echo "$HOST_PORT" | cut -d: -f1)
PORT=$(echo "$HOST_PORT" | cut -d: -f2)

echo "Waiting for $HOST:$PORT (timeout ${TIMEOUT}s)..."

for i in $(seq 1 $TIMEOUT); do
  if timeout 1 bash -c "cat < /dev/null > /dev/tcp/$HOST/$PORT" 2>/dev/null; then
    echo "✓ $HOST:$PORT is available"
    exec "$@"
  fi
  sleep 1
done

echo "✗ Timeout waiting for $HOST:$PORT"
exit 1