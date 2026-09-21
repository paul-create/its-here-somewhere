#!/bin/bash

set -e

# Configuration
PROD_DB="${PROD_DB:-postgresql://postgres:password@your-rds-endpoint:5432/its_here_somewhere}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SQL_DIR="$SCRIPT_DIR/.."

echo "=== Its Here Somewhere - Database Deploy ==="
echo "RDS Instance: $PROD_DB"
echo ""

if ! command -v migra &> /dev/null; then
    echo "ERROR: migra not found. Install with: pip install migra"
    exit 1
fi

echo "Step 1: Creating temp schema in RDS..."
psql "$PROD_DB" -c "DROP SCHEMA IF EXISTS _compare CASCADE;" > /dev/null 2>&1
psql "$PROD_DB" -c "CREATE SCHEMA _compare;" > /dev/null 2>&1

echo "Step 2: Loading schema files into _compare schema..."
psql "$PROD_DB" -c "CREATE SCHEMA IF NOT EXISTS dbo;" > /dev/null 2>&1
psql "$PROD_DB" -c "CREATE SCHEMA IF NOT EXISTS _deleted;" > /dev/null 2>&1

echo "Step 3: Loading tables into _compare..."
for file in "$SQL_DIR"/tables/*.sql; do
  if [ -f "$file" ]; then
    echo "  Loading $(basename "$file")..."
    # Prepend schema prefix to all tables in _compare
    sed 's/CREATE TABLE IF NOT EXISTS /CREATE TABLE IF NOT EXISTS _compare./g' "$file" | psql "$PROD_DB" > /dev/null 2>&1
  fi
done

echo "Step 4: Loading procedures, functions, triggers into _compare..."
for file in "$SQL_DIR"/procedures/*.sql; do
  if [ -f "$file" ]; then
    sed 's/CREATE OR REPLACE PROCEDURE /CREATE OR REPLACE PROCEDURE _compare./g' "$file" | psql "$PROD_DB" > /dev/null 2>&1
  fi
done

echo ""
echo "Step 5: Comparing production vs desired state..."
migra "postgresql://postgres:password@your-rds-endpoint:5432/its_here_somewhere?options=-csearch_path=public" "postgresql://postgres:password@your-rds-endpoint:5432/its_here_somewhere?options=-csearch_path=_compare" > "$SQL_DIR/migration_delta.sql"

if [ ! -s "$SQL_DIR/migration_delta.sql" ]; then
    echo "No changes detected. Schema is up to date."
    psql "$PROD_DB" -c "DROP SCHEMA IF EXISTS _compare CASCADE;" > /dev/null 2>&1
    echo "Deploy complete!"
    exit 0
fi

echo "Changes detected:"
echo "---"
cat "$SQL_DIR/migration_delta.sql"
echo "---"
echo ""
read -p "Apply changes to production? (yes/no): " -r RESPONSE
if [[ ! $RESPONSE =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deploy cancelled."
    exit 1
fi

echo "Step 6: Applying changes to production..."
psql "$PROD_DB" -f "$SQL_DIR/migration_delta.sql"

echo "Step 7: Cleaning up _compare schema..."
psql "$PROD_DB" -c "DROP SCHEMA IF EXISTS _compare CASCADE;" > /dev/null 2>&1

echo ""
echo "✓ Deploy complete!"
echo "Migration script saved to: $SQL_DIR/migration_delta.sql"