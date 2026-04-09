#!/bin/zsh

set -euo pipefail

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN || true)"

  if [[ -z "$pids" ]]; then
    echo "Nothing listening on :$port"
    return
  fi

  echo "Stopping listeners on :$port"
  printf "%s\n" "$pids" | xargs kill
}

stop_port 3000
stop_port 8888
stop_port 8090
