#!/bin/bash

set -e

echo "=== Its Here Somewhere - Migration Runner ==="

if [ -z "$PROD_DB" ]; then
  echo "Error: PROD_DB environment variable not set"
  exit 1
fi

MANUAL_DIR="sql/scripts/migration/manual"
ARCHIVE_DIR="sql/scripts/migration/archive"

# Create directories if they don't exist
mkdir -p "$MANUAL_DIR"
mkdir -p "$ARCHIVE_DIR"

# Check for migrations to run
MIGRATIONS=$(find "$MANUAL_DIR" -maxdepth 1 -name "*.sql" -type f | sort)

if [ -z "$MIGRATIONS" ]; then
  echo "No migrations found in $MANUAL_DIR"
  exit 0
fi

echo "Found migrations to run:"
echo "$MIGRATIONS"
echo ""

# Run each migration
for migration_file in $MIGRATIONS; do
  migration_name=$(basename "$migration_file")
  echo "Running: $migration_name"
  
  # Execute the migration - fail on any SQL error
  if psql "$PROD_DB" -v ON_ERROR_STOP=1 -f "$migration_file"; then
    echo "✓ Successfully applied: $migration_name"
    
    # Archive the migration
    mv "$migration_file" "$ARCHIVE_DIR/$migration_name"
    echo "  Archived to: $ARCHIVE_DIR/$migration_name"
  else
    echo "✗ Failed to apply: $migration_name"
    echo "  Migration left in $MANUAL_DIR for retry"
    exit 1
  fi
  echo ""
done

echo "=== All migrations completed successfully ==="