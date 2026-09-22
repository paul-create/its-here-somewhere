#!/bin/bash
# =============================================================================
# Its Here Somewhere - Database Deploy
#
#   Step 1  pre-deploy   migration/pre-deploy/*.sql   run once, moved to migration/archive/pre-deploy/
#   Step 2  objects      schema, tables, functions, procedures, triggers (re-applied every run)
#   Step 3  post-deploy  migration/post-deploy/*.sql  run once, moved to migration/archive/post-deploy/
#
# Pre-deploy:  anything the object files can't do themselves - dropping procs whose
#              parameters changed, dropping removed objects, ALTER TABLE.
# Post-deploy: data fixes and clean-ups that need the new objects in place.
# =============================================================================

set -euo pipefail

echo "=== Its Here Somewhere - Database Deploy ==="

if [ -z "${PROD_DB:-}" ]; then
  echo "Error: PROD_DB environment variable not set"
  exit 1
fi

MIGRATION_DIR="sql/scripts/migration"
PRE_DIR="$MIGRATION_DIR/pre-deploy"
POST_DIR="$MIGRATION_DIR/post-deploy"
ARCHIVE_DIR="$MIGRATION_DIR/archive"
mkdir -p "$PRE_DIR" "$POST_DIR" "$ARCHIVE_DIR/pre-deploy" "$ARCHIVE_DIR/post-deploy"

PSQL=(psql "$PROD_DB" -v ON_ERROR_STOP=1 --quiet)

# Tables in foreign-key order (only matters when a table is new).
# Any table file not listed here runs after these.
TABLE_ORDER=(homes users categories locations items item_locations photos tags activity_log)

# -----------------------------------------------------------------------------
# Run each script in a folder once, in name order, archiving it on success
# -----------------------------------------------------------------------------
run_migrations() {
  local dir="$1"
  local archive="$2"
  local label="$3"

  echo ""
  echo "--- $label ---"

  mapfile -t files < <(find "$dir" -maxdepth 1 -name '*.sql' -type f | sort)
  if [ ${#files[@]} -eq 0 ]; then
    echo "Nothing to run"
    return
  fi

  for file in "${files[@]}"; do
    local name
    name=$(basename "$file")
    echo "Running: $name"
    if "${PSQL[@]}" -f "$file"; then
      mv "$file" "$archive/$name"
      echo "  OK - archived to $archive/"
    else
      echo "  FAILED - left in $dir for retry"
      exit 1
    fi
  done
}

# -----------------------------------------------------------------------------
# Re-apply every object file, in dependency order, as one transaction
# -----------------------------------------------------------------------------
deploy_objects() {
  echo ""
  echo "--- Step 2: schema objects ---"

  shopt -s nullglob
  local files=(sql/schema/*.sql)

  for table in "${TABLE_ORDER[@]}"; do
    [ -f "sql/tables/$table.sql" ] && files+=("sql/tables/$table.sql")
  done
  for file in sql/tables/*.sql; do
    local name
    name=$(basename "$file" .sql)
    if [[ ! " ${TABLE_ORDER[*]} " =~ " $name " ]]; then
      files+=("$file")
    fi
  done

  files+=(sql/tables/_deleted/*.sql sql/functions/*.sql sql/procedures/*.sql sql/triggers/*.sql)
  shopt -u nullglob

  # Safety check: object files must not start their own transactions.
  # A migration script pasted into an object file by mistake would otherwise
  # run inside this deploy (e.g. dropping procedures that were just created).
  local bad
  bad=$(grep -liE '^[[:space:]]*BEGIN[[:space:]]*;' "${files[@]}" || true)
  if [ -n "$bad" ]; then
    echo "FAILED - these object files contain a BEGIN; statement (a migration script, not an object):"
    echo "$bad"
    echo "Move migration scripts to $PRE_DIR or $POST_DIR."
    exit 1
  fi

  local args=()
  for file in "${files[@]}"; do
    echo "  $file"
    args+=(-f "$file")
  done

  "${PSQL[@]}" --single-transaction "${args[@]}"
  echo "  OK - all objects applied"
}

run_migrations "$PRE_DIR" "$ARCHIVE_DIR/pre-deploy" "Step 1: pre-deploy scripts"
deploy_objects
run_migrations "$POST_DIR" "$ARCHIVE_DIR/post-deploy" "Step 3: post-deploy scripts"

echo ""
echo "=== Deploy completed successfully ==="