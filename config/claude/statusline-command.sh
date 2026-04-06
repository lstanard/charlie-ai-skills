#!/usr/bin/env bash
# statusline-command.sh
#
# Two-line Claude Code status line.
#
# Line 1: [Model] 📁 directory  🌿 git-branch
# Line 2: [context bar] context% | $cost | session duration

input=$(cat)

# --- Extract fields from JSON input ---
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // ""')
model_display=$(echo "$input" | jq -r '.model.display_name // ""')
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
total_input=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
total_output=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')
session_id=$(echo "$input" | jq -r '.session_id // ""')

dir=$(basename "$cwd")

# Shorten model name: strip the date suffix and keep the short label
# e.g. "Claude 3.5 Sonnet" -> "Sonnet", "Claude Sonnet 4.6" -> "Sonnet 4.6"
model_short=$(echo "$model_display" | sed 's/^Claude[[:space:]]*//' | sed 's/[[:space:]]*[0-9]\{8\}$//')

# Resolve git branch without acquiring optional locks
branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null)

# ANSI color helpers
RESET="\033[0m"
CYAN="\033[36m"
GREEN="\033[32m"
YELLOW="\033[33m"
DIM="\033[2m"

# --- Line 1: [Model] 📁 dir  🌿 branch ---
if [ -n "$branch" ]; then
  printf "${CYAN}[%s]${RESET} 📁 ${GREEN}%s${RESET}  🌿 ${CYAN}%s${RESET}" \
    "$model_short" "$dir" "$branch"
else
  printf "${CYAN}[%s]${RESET} 📁 ${GREEN}%s${RESET}" \
    "$model_short" "$dir"
fi

printf "\n"

# --- Line 2: context bar | cost | duration ---

# Context bar: 10 blocks, filled vs dotted
if [ -n "$used_pct" ]; then
  filled=$(echo "$used_pct" | awk '{printf "%d", ($1 / 10 + 0.5)}')
  [ "$filled" -gt 10 ] && filled=10
  empty=$((10 - filled))
  bar=""
  for i in $(seq 1 "$filled"); do bar="${bar}█"; done
  for i in $(seq 1 "$empty");  do bar="${bar}·"; done
  pct_label=$(printf "%.0f%%" "$used_pct")
else
  bar="··········"
  pct_label="-%"
fi

# Estimated cost: rough approximation using public pricing for Sonnet-class models
# Input tokens ~$3/M, output tokens ~$15/M (blended estimate, not exact billing)
cost=$(awk -v i="$total_input" -v o="$total_output" \
  'BEGIN { printf "%.2f", (i * 3 + o * 15) / 1000000 }')

# Session duration: derive from transcript path timestamp or fall back to session_id
# The transcript path embeds a unix-style timestamp in its filename on some builds;
# we use a lightweight approach: track start time via a per-session temp file.
session_start_file="/tmp/claude-session-start-${session_id}"
if [ ! -f "$session_start_file" ]; then
  date +%s > "$session_start_file"
fi
start_ts=$(cat "$session_start_file")
now_ts=$(date +%s)
elapsed=$(( now_ts - start_ts ))
elapsed_min=$(( elapsed / 60 ))
elapsed_sec=$(( elapsed % 60 ))
duration="${elapsed_min}m ${elapsed_sec}s"

printf "${DIM}%s${RESET} %s  ${YELLOW}\$%s${RESET}  ⏱ %s" \
  "$bar" "$pct_label" "$cost" "$duration"
