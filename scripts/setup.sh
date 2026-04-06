#!/usr/bin/env bash
# setup.sh — Bootstrap Claude Code config from this repo via symlinks.
# Safe to re-run: backs up existing files before replacing them.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_DIR="$REPO_ROOT/config/claude"
CLAUDE_DIR="$HOME/.claude"

SYMLINKS=(
  "$CONFIG_DIR/settings.json:$CLAUDE_DIR/settings.json"
  "$CONFIG_DIR/CLAUDE.md:$CLAUDE_DIR/CLAUDE.md"
  "$CONFIG_DIR/hooks/notify.sh:$CLAUDE_DIR/hooks/notify.sh"
  "$CONFIG_DIR/statusline-command.sh:$CLAUDE_DIR/statusline-command.sh"
)

backup_and_link() {
  local src="$1"
  local dest="$2"

  # Already the correct symlink — nothing to do
  if [ -L "$dest" ] && [ "$(readlink "$dest")" = "$src" ]; then
    echo "  already linked: $dest"
    return
  fi

  # Back up any real file that's in the way
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    local backup="${dest}.bak.$(date +%Y%m%d%H%M%S)"
    echo "  backing up: $dest → $backup"
    mv "$dest" "$backup"
  elif [ -L "$dest" ]; then
    # Stale or wrong symlink — remove it
    echo "  removing stale symlink: $dest"
    rm "$dest"
  fi

  mkdir -p "$(dirname "$dest")"
  ln -s "$src" "$dest"
  echo "  linked: $dest → $src"
}

echo "Setting up Claude Code config symlinks..."
for pair in "${SYMLINKS[@]}"; do
  src="${pair%%:*}"
  dest="${pair##*:}"
  backup_and_link "$src" "$dest"
done

echo ""
echo "Done. Restart Claude Code to pick up any settings changes."
