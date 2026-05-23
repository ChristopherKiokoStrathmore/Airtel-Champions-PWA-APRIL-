#!/usr/bin/env python3
"""Check for admin phone rows in `app_users` and `installers`.

Usage (PowerShell/CMD):
  set DATABASE_URL=postgres://user:pass@host:5432/dbname   (CMD)
  $env:DATABASE_URL = 'postgres://user:pass@host:5432/dbname'  (PowerShell)
  python scripts\check_admin_row.py
"""
import os
import sys
import psycopg2

def norm_expr(col):
    # SQL expression used to normalise phone in DB
    return "replace(replace(replace(coalesce(%s,''),' ','') ,'-',''),'+','')" % col

def main():
    db = os.environ.get('DATABASE_URL')
    if not db:
        print('Error: set DATABASE_URL environment variable first', file=sys.stderr)
        return 2

    conn = psycopg2.connect(db)
    cur = conn.cursor()
    try:
        phones = ['785638462','0785638462']
        ph_list = ','.join("'%s'" % p for p in phones)

        # app_users
        q1 = f"SELECT id, phone_number, role, full_name FROM public.app_users WHERE {norm_expr('phone_number')} IN ({ph_list})"
        cur.execute(q1)
        rows1 = cur.fetchall()
        print('app_users matches:')
        if rows1:
            for r in rows1:
                print(' ', r)
        else:
            print('  (none)')

        # installers
        q2 = f"SELECT id, phone, name FROM public.installers WHERE {norm_expr('phone')} IN ({ph_list})"
        cur.execute(q2)
        rows2 = cur.fetchall()
        print('\ninstallers matches:')
        if rows2:
            for r in rows2:
                print(' ', r)
        else:
            print('  (none)')

    finally:
        cur.close()
        conn.close()

    return 0


if __name__ == '__main__':
    sys.exit(main())
