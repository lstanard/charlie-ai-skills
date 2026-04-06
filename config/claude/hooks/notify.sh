#!/bin/bash
INPUT=$(cat)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

# Derive repo context for the notification title
REPO_LABEL=""
if [ -n "$CWD" ] && [ -d "$CWD" ]; then
  REPO_LABEL=$(basename "$CWD")
  BRANCH=$(git -C "$CWD" rev-parse --abbrev-ref HEAD 2>/dev/null)
  if [ -n "$BRANCH" ] && [ "$BRANCH" != "HEAD" ]; then
    REPO_LABEL="$REPO_LABEL ($BRANCH)"
  fi
fi

send_notification() {
  local title="$1"
  local message="$2"
  if [ -n "$REPO_LABEL" ]; then
    message="$REPO_LABEL\n$message"
  fi
  title="${title//\"/\\\"}"
  message="${message//\"/\\\"}"
  printf 'display notification "%s" with title "%s" sound name "Glass"' "$message" "$title" | osascript
}

case "$EVENT" in
  Notification)
    TYPE=$(echo "$INPUT" | jq -r '.notification_type // "unknown"')
    case "$TYPE" in
      permission_prompt)
        TOOL=$(echo "$INPUT" | jq -r '.tool_name // "a tool"')
        send_notification "Claude Code - Permission Needed" "Approve use of: $TOOL"
        ;;
      idle_prompt)
        send_notification "Claude Code - Waiting" "Claude is waiting for your input"
        ;;
      *)
        send_notification "Claude Code" "Notification: $TYPE"
        ;;
    esac
    ;;
  Stop)
    send_notification "Claude Code - Done" "Claude has finished responding"
    ;;
  TaskCompleted)
    TASK=$(echo "$INPUT" | jq -r '.task_subject // "a task"')
    send_notification "Claude Code - Task Complete" "$TASK"
    ;;
esac

exit 0
