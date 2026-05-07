#!/usr/bin/env python3
"""Run a SQL migration file using DATABASE_URL env var.

Usage (Windows CMD):
  set DATABASE_URL=postgres://user:pass@host:5432/dbname
  python scripts\run_migration.py supabase/migrations/20260507_upsert_admin_sales_developer.sql

Usage (PowerShell):
  $env:DATABASE_URL = 'postgres://user:pass@host:5432/dbname'
  python scripts/run_migration.py supabase/migrations/20260507_upsert_admin_sales_developer.sql
"""
import os
import sys
import psycopg2


def main():
    if 'DATABASE_URL' not in os.environ:
        print('Error: set DATABASE_URL environment variable first', file=sys.stderr)
        return 2
    if len(sys.argv) < 2:
        print('Usage: python scripts/run_migration.py path/to/sqlfile.sql', file=sys.stderr)
        return 2

    sql_path = sys.argv[1]
    if not os.path.exists(sql_path):
        print('SQL file not found:', sql_path, file=sys.stderr)
        return 2

    sql = open(sql_path, 'r', encoding='utf-8').read()
    dburl = os.environ['DATABASE_URL']

    conn = psycopg2.connect(dburl)
    cur = conn.cursor()
    try:
        cur.execute(sql)
        conn.commit()
        print('Migration executed:', sql_path)
    except Exception as e:
        conn.rollback()
        print('Migration failed:', e, file=sys.stderr)
        return 1
    finally:
        cur.close()
        conn.close()

    return 0


if __name__ == '__main__':
    sys.exit(main())
