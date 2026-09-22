#!/bin/bash

set -e

echo "=== Its Here Somewhere - Database Deploy (Plan Generation) ==="

if [ -z "$PROD_DB" ]; then
  echo "Error: PROD_DB environment variable not set"
  exit 1
fi

echo "RDS Instance: ${PROD_DB%%@*}@${PROD_DB##*@}"

# Step 1: Create/recreate temp schema
echo "Step 1: Creating temp schema..."
psql "$PROD_DB" -c "DROP SCHEMA IF EXISTS _compare CASCADE;" 2>/dev/null || true
psql "$PROD_DB" -c "CREATE SCHEMA _compare;" 2>/dev/null

# Step 2: Load schema files into _compare
echo "Step 2: Loading schema files into _compare..."
for schema_file in sql/schema/*.sql; do
  if [ -f "$schema_file" ]; then
    sed 's/CREATE SCHEMA IF NOT EXISTS public/CREATE SCHEMA IF NOT EXISTS _compare/g' "$schema_file" | psql "$PROD_DB" -q 2>/dev/null || true
  fi
done

# Step 3: Load tables into _compare
echo "Step 3: Loading tables into _compare..."
for table_file in sql/tables/*.sql; do
  if [ -f "$table_file" ]; then
    sed 's/public\./\_compare\./g' "$table_file" | psql "$PROD_DB" -q 2>/dev/null || true
  fi
done

# Step 3b: Load deleted tables into _compare
for table_file in sql/tables/_deleted/*.sql; do
  if [ -f "$table_file" ]; then
    sed 's/public\./\_compare\./g' "$table_file" | psql "$PROD_DB" -q 2>/dev/null || true
  fi
done

# Step 4: Load procedures, functions, triggers into _compare
echo "Step 4: Loading procedures, functions, triggers into _compare..."
for proc_file in sql/procedures/*.sql sql/functions/*.sql sql/triggers/*.sql; do
  if [ -f "$proc_file" ]; then
    sed 's/public\./\_compare\./g' "$proc_file" | psql "$PROD_DB" -q 2>/dev/null || true
  fi
done

# Step 5: Generate migration plan
echo "Step 5: Generating migration plan..."
COMPARE_DB=$(echo "$PROD_DB" | sed 's/\/its_here_somewhere$/\/_compare/')
MIGRA_OUTPUT=$(migra "$PROD_DB" "$COMPARE_DB" 2>&1) || true

if [ -z "$MIGRA_OUTPUT" ] || [ "$MIGRA_OUTPUT" == "-- no changes" ]; then
  echo ""
  echo "✓ Database schema is up to date - no changes needed"
  echo "" > sql/scripts/migration_delta.sql
else
  echo "$MIGRA_OUTPUT" > sql/scripts/migration_delta.sql
  echo ""
  echo "=== Migration Plan Generated ==="
  echo ""
  cat sql/scripts/migration_delta.sql
  echo ""
  echo "Review the changes above."
  echo "If approved, the next step will apply this migration."
fi

# Step 6: Cleanup
echo ""
echo "Step 6: Cleaning up temp schema..."
psql "$PROD_DB" -c "DROP SCHEMA IF EXISTS _compare CASCADE;" -q 2>/dev/null || true

echo ""
echo "=== Plan Generation Complete ==="