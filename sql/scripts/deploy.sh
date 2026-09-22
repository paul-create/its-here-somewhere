#!/bin/bash

set -e

echo "=== Its Here Somewhere - Database Deploy (Plan Generation) ==="

if [ -z "$PROD_DB" ]; then
  echo "Error: PROD_DB environment variable not set"
  exit 1
fi

echo "RDS Instance: ${PROD_DB%%@*}@${PROD_DB##*@}"

# Build the compare database connection string (swap its_here_somewhere for _compare_db)
COMPARE_DB=$(echo "$PROD_DB" | sed 's/\/its_here_somewhere$/\/_compare_db/')

# Step 1: Create/recreate temp database
echo "Step 1: Creating temp database..."
psql "$PROD_DB" -c "DROP DATABASE IF EXISTS _compare_db;" 2>/dev/null || true
psql "$PROD_DB" -c "CREATE DATABASE _compare_db;" 2>/dev/null

# Step 2-4: Load all schema into _compare_db
echo "Step 2-4: Loading schema into _compare_db..."
for schema_file in sql/schema/*.sql; do
  if [ -f "$schema_file" ]; then
    psql "$COMPARE_DB" -q -f "$schema_file" 2>/dev/null || true
  fi
done

for table_file in sql/tables/*.sql; do
  if [ -f "$table_file" ]; then
    psql "$COMPARE_DB" -q -f "$table_file" 2>/dev/null || true
  fi
done

for table_file in sql/tables/_deleted/*.sql; do
  if [ -f "$table_file" ]; then
    psql "$COMPARE_DB" -q -f "$table_file" 2>/dev/null || true
  fi
done

for proc_file in sql/procedures/*.sql sql/functions/*.sql sql/triggers/*.sql; do
  if [ -f "$proc_file" ]; then
    psql "$COMPARE_DB" -q -f "$proc_file" 2>/dev/null || true
  fi
done

# Step 5: Generate migration plan
echo "Step 5: Generating migration plan..."
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
echo "Step 6: Cleaning up temp database..."
psql "$PROD_DB" -c "DROP DATABASE IF EXISTS _compare_db;" -q 2>/dev/null || true

echo ""
echo "=== Plan Generation Complete ==="