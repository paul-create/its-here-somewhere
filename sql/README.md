# Its Here Somewhere - SQL Schema Project

Schema-as-code for the PostgreSQL backend. All database objects are defined in version-controlled SQL files.

## Structure

```
sql/
├── schema/
│   ├── dbo.sql
│   └── _deleted.sql
├── tables/
│   ├── users.sql
│   ├── homes.sql
│   ├── categories.sql
│   ├── locations.sql
│   ├── items.sql
│   ├── item_locations.sql
│   ├── photos.sql
│   ├── tags.sql
│   ├── activity_log.sql
│   └── _deleted/
│       ├── items_deleted.sql
│       ├── categories_deleted.sql
│       ├── locations_deleted.sql
│       └── photos_deleted.sql
├── procedures/
│   ├── sp_createHome.sql
│   ├── sp_getAllItems.sql
│   ├── sp_createItem.sql
│   ├── sp_updateItem.sql
│   ├── sp_softDeleteItem.sql
│   ├── sp_moveItemLocation.sql
│   └── (more procedures)
├── functions/
│   └── fn_generateHomeCode.sql
├── triggers/
│   ├── tr_audit_items.sql
│   └── tr_audit_categories.sql
├── seed/
│   └── initial_data.sql
├── scripts/
│   ├── deploy.sh
│   └── rollback.sh
└── README.md
```

## Prerequisites

Install required tools:

- PostgreSQL client (psql)
- migra for schema comparison: `pip install migra`

## Setup

Create local temp database:

```
createdb -U postgres its_here_somewhere_temp
```

Set environment variables:

```
export PROD_DB="postgresql://postgres:password@your-rds-endpoint:5432/its_here_somewhere"
export TEMP_DB="postgresql://postgres:password@localhost:5432/its_here_somewhere_temp"
```

## Deployment

Run the deploy script:

```
chmod +x sql/scripts/deploy.sh
./sql/scripts/deploy.sh
```

The script will:

1. Load all SQL files into a temporary schema
2. Use migra to detect differences between production and desired state
3. Show you the delta (only changes needed)
4. Ask for confirmation
5. Apply only the necessary changes to production
6. Save the migration delta to migration_delta.sql for audit trail

## Key Features

Schema Comparison: Only changed objects are deployed. No unnecessary ALTER statements.

Idempotent SQL: All files use CREATE IF NOT EXISTS, DROP IF EXISTS. Safe to run multiple times.

No Version Files: Unlike Flyway, no V1, V2, V3 naming. Just update the existing file and let migra handle the diff.

Dependency Ordered: Files load in correct sequence - schemas, then tables, then functions, procedures, triggers.

## Development Workflow

1. Edit SQL files in feature branch
2. Test locally
3. Commit to Git
4. Run ./sql/scripts/deploy.sh
5. Review delta
6. Apply to production

## Making Changes

Add a new table:

Create sql/tables/my_table.sql with your CREATE TABLE statement. Run deploy.sh - only the CREATE will be applied.

Modify a table:

Edit the existing sql/tables/items.sql with ALTER statements. Run deploy.sh - only the ALTER will be applied.

Add a procedure:

Create sql/procedures/sp_myProcedure.sql. Run deploy.sh.

## Git Workflow

```
git checkout -b feature/add-new-table
# Edit sql files
git add sql/
git commit -m "Add new_table with home_id column"
git push origin feature/add-new-table
# Create PR, merge
./sql/scripts/deploy.sh  # Run against production
```

## Troubleshooting

migra command not found:
```
pip install migra
```

Could not connect to temp database:
```
createdb -U postgres its_here_somewhere_temp
```

Permission denied on deploy.sh:
```
chmod +x sql/scripts/deploy.sh
```

## Rollback

Review migration_delta.sql to see what changed. For rollback:

1. Write inverse SQL (e.g., DROP TABLE instead of CREATE)
2. Create sql/rollback/YYYY-MM-DD-rollback.sql
3. Test locally
4. Apply to production

## Notes

All SQL files must be idempotent (safe to run multiple times).

The deploy script creates a temp schema - do not use it for other purposes.

Schema comparison is handled by migra - no manual sequencing needed.

Only the delta is applied - zero waste, zero redundancy.

Migration delta saved to migration_delta.sql - commit this for audit trail.