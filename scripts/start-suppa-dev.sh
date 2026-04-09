#!/bin/zsh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKTREE_ROOT="$REPO_ROOT/.claude/worktrees/iteration-1"
BACKEND_DIR="$WORKTREE_ROOT/backend"
FRONTEND_DIR="$WORKTREE_ROOT/frontend"
POCKETBASE_BIN="${POCKETBASE_BIN:-/Users/jonsearle/bin/pocketbase}"

open_terminal_window() {
  local title="$1"
  local command="$2"

  osascript <<OSA
tell application "Terminal"
  activate
  do script "printf '\\e]1;${title}\\a'; ${command}"
end tell
OSA
}

port_is_listening() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

ensure_path_command() {
  local primary="$1"
  local fallback="$2"
  if command -v "$primary" >/dev/null 2>&1; then
    printf "%s" "$primary"
  else
    printf "%s" "$fallback"
  fi
}

POCKETBASE_CMD="$(ensure_path_command pocketbase "$POCKETBASE_BIN")"

echo "Starting Suppa local development services..."
echo

if port_is_listening 8090; then
  echo "PocketBase already running on :8090, skipping new window."
else
  open_terminal_window \
    "Suppa PocketBase" \
    "cd '$REPO_ROOT' && '$POCKETBASE_CMD' serve; exec zsh"
  echo "Opened PocketBase window."
fi

if port_is_listening 8888; then
  echo "Backend already running on :8888, skipping new window."
else
  open_terminal_window \
    "Suppa Backend" \
    "cd '$BACKEND_DIR' && npm run dev:local; exec zsh"
  echo "Opened backend window."
fi

if port_is_listening 3000; then
  echo "Frontend already running on :3000, skipping new window."
else
  open_terminal_window \
    "Suppa Frontend" \
    "cd '$FRONTEND_DIR' && npm start; exec zsh"
  echo "Opened frontend window."
fi

echo
echo "Suppa app URL: http://localhost:3000"
