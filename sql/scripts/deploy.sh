#!/bin/bash

set -e

echo "=== Its Here Somewhere - Database Deploy (Plan Generation) ==="

if [ -z "$PROD_DB" ]; then
  echo "Error: PROD_DB environment variable not set"
  exit 1
fi

echo "RDS Instance: ${PROD_DB%%@*}@${PROD_DB##*@}"

COMPARE_DB=$(echo "$PROD_DB" | sed 's/\/its_here_somewhere$/\/_compare_db/')

# Step 1: Create temp database
echo "Step 1: Creating temp database..."
psql "$PROD_DB" -c "DROP DATABASE IF EXISTS _compare_db;" 2>/dev/null || true
psql "$PROD_DB" -c "CREATE DATABASE _compare_db;" 2>/dev/null

# Step 2-4: Load schema
echo "Step 2-4: Loading schema into _compare_db..."
for file in sql/schema/*.sql sql/tables/*.sql sql/tables/_deleted/*.sql sql/procedures/*.sql sql/functions/*.sql sql/triggers/*.sql; do
  [ -f "$file" ] && psql "$COMPARE_DB" -q -f "$file" 2>/dev/null || true
done

# Step 5: Generate migration plan with --unsafe to get all changes
echo "Step 5: Generating migration plan..."
MIGRA_OUTPUT=$(migra --unsafe "$PROD_DB" "$COMPARE_DB" 2>&1) || true

# Save to file for apply step
echo "$MIGRA_OUTPUT" > sql/scripts/migration_delta.sql

echo ""
echo "=== REVIEW THE MIGRATION PLAN BELOW ==="
echo ""
cat sql/scripts/migration_delta.sql
echo ""
echo "=== END OF PLAN ==="
echo ""
echo "If this looks correct, approve the workflow to apply these changes."
echo ""

# Step 6: Cleanup
echo "Step 6: Cleaning up temp database..."
psql "$PROD_DB" -c "DROP DATABASE IF EXISTS _compare_db;" -q 2>/dev/null || true

echo "=== Plan Generation Complete ==="