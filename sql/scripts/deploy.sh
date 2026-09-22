#!/bin/bash

set -e

echo "=== Its Here Somewhere - Database Deploy ==="

# Check if PROD_DB is set
if [ -z "$PROD_DB" ]; then
  echo "Error: PROD_DB environment variable not set"
  exit 1
fi

echo "RDS Instance: ${PROD_DB%%@*}@${PROD_DB##*@}"

# Build the compare database connection string (swap its_here_somewhere for _compare_db)
COMPARE_DB=$(echo "$PROD_DB" | sed 's/\/its_here_somewhere$/\/_compare_db/')

# Step 1: Create/recreate temp database
echo "Step 1: Creating temp database in RDS..."
psql "$PROD_DB" -c "DROP DATABASE IF EXISTS _compare_db;" 2>/dev/null || true
psql "$PROD_DB" -c "CREATE DATABASE _compare_db;"

# Step 2: Load schema files into compare database
echo "Step 2: Loading schema files into _compare_db..."
for schema_file in sql/schema/*.sql; do
  if [ -f "$schema_file" ]; then
    psql "$COMPARE_DB" -q -f "$schema_file" 2>/dev/null || true
  fi
done

# Step 3: Load tables into compare database
echo "Step 3: Loading tables into _compare_db..."
for table_file in sql/tables/*.sql; do
  if [ -f "$table_file" ]; then
    filename=$(basename "$table_file")
    echo "  Loading $filename..."
    psql "$COMPARE_DB" -q -f "$table_file" 2>/dev/null || true
  fi
done

# Step 3b: Load deleted tables into compare database
echo "Step 3b: Loading deleted tables into _compare_db..."
for table_file in sql/tables/_deleted/*.sql; do
  if [ -f "$table_file" ]; then
    filename=$(basename "$table_file")
    echo "  Loading _deleted/$filename..."
    psql "$COMPARE_DB" -q -f "$table_file" 2>/dev/null || true
  fi
done

# Step 4: Load procedures, functions, triggers into compare database
echo "Step 4: Loading procedures, functions, triggers into _compare_db..."
for proc_file in sql/procedures/*.sql sql/functions/*.sql sql/triggers/*.sql; do
  if [ -f "$proc_file" ]; then
    psql "$COMPARE_DB" -q -f "$proc_file" 2>/dev/null || true
  fi
done

# Step 5: Compare using migra
echo "Step 5: Comparing production vs desired state..."
MIGRA_OUTPUT=$(migra "$PROD_DB" "$COMPARE_DB" 2>&1) || true

if [ -n "$MIGRA_OUTPUT" ] && [ "$MIGRA_OUTPUT" != "-- no changes" ]; then
  echo "$MIGRA_OUTPUT" > sql/scripts/migration_delta.sql
  echo ""
  echo "=== Migration Changes Detected ==="
  cat sql/scripts/migration_delta.sql
  echo ""
  echo "Applying changes..."
  psql "$PROD_DB" -f sql/scripts/migration_delta.sql -q
  echo "✓ Database updated successfully"
else
  echo "✓ Database schema is up to date - no changes needed"
  echo "" > sql/scripts/migration_delta.sql
fi

# Step 6: Cleanup - drop temp database
echo "Step 6: Cleaning up temp database..."
psql "$PROD_DB" -c "DROP DATABASE IF EXISTS _compare_db;" -q 2>/dev/null || true

echo ""
echo "=== Deployment Complete ==="