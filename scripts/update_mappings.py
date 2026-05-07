#!/usr/bin/env python3
"""Update user mappings (SE, ZSM, ZBM) from an Excel file into the DB.

Usage:
  python scripts/update_mappings.py --file path/to/file.xlsb --db-url "$DATABASE_URL"

Behaviour:
  - Reads first sheet (supports .xlsb via pyxlsb or .xlsx/.xls via pandas).
  - Looks for columns that map to phone and se/zsm/zbm (case-insensitive).
  - Updates `app_users` (phone_number) and `airtelmoney_agents` (phone) where matches found.
  - Writes `mappings_unmatched.csv` for rows that didn't match any table.
"""
from __future__ import annotations
import argparse
import os
import sys
import csv
from pathlib import Path
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch


def norm_phone(p: str) -> str:
    if p is None:
        return ''
    s = str(p).strip()
    # remove spaces, dashes, parentheses
    for ch in [' ', '-', '(', ')']:
        s = s.replace(ch, '')
    # remove leading +
    if s.startswith('+'):
        s = s[1:]
    # remove leading zero for local formats (app normalises 078... -> 78...)
    if s.startswith('0'):
        s = s[1:]
    return s


def find_column(columns, candidates):
    cols = {c.lower(): c for c in columns}
    for cand in candidates:
        if cand.lower() in cols:
            return cols[cand.lower()]
    # try fuzzy: match by substring
    for col in columns:
        low = col.lower()
        for cand in candidates:
            if cand.lower() in low:
                return col
    return None


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--file', '-f', required=True)
    p.add_argument('--db-url', '-d', default=os.environ.get('DATABASE_URL'))
    p.add_argument('--dry-run', action='store_true')
    args = p.parse_args()

    if not args.db_url:
        print('Error: DB URL must be provided via --db-url or DATABASE_URL env var', file=sys.stderr)
        sys.exit(2)

    fp = Path(args.file)
    if not fp.exists():
        print(f'Error: file not found: {fp}', file=sys.stderr)
        sys.exit(2)

    ext = fp.suffix.lower()
    if ext == '.xlsb':
        engine = 'pyxlsb'
    else:
        engine = None

    df = pd.read_excel(fp, engine=engine)
    if df.empty:
        print('No rows found in file')
        sys.exit(0)

    # identify columns
    cols = list(df.columns)
    phone_col = find_column(cols, ['phone', 'phone_number', 'msisdn', 'mobile', 'contact', 'phone no'])
    se_col = find_column(cols, ['se', 'tse', 'sales exec', 'tse/se'])
    zsm_col = find_column(cols, ['zsm'])
    zbm_col = find_column(cols, ['zbm'])

    if not phone_col:
        print('Could not find phone column. Available columns:', cols)
        sys.exit(2)

    # normalize dataframe
    df = df[[c for c in [phone_col, se_col, zsm_col, zbm_col] if c is not None]]
    df = df.rename(columns={phone_col: 'phone', se_col: 'se', zsm_col: 'zsm', zbm_col: 'zbm'})
    df['phone_norm'] = df['phone'].apply(norm_phone)

    conn = psycopg2.connect(args.db_url)
    cur = conn.cursor()

    unmatched_rows = []
    updated_count = 0

    try:
        for _, row in df.iterrows():
            phone = row.get('phone_norm')
            se = row.get('se') if 'se' in row.index else None
            zsm = row.get('zsm') if 'zsm' in row.index else None
            zbm = row.get('zbm') if 'zbm' in row.index else None

            if not phone:
                unmatched_rows.append((row.get('phone'), se, zsm, zbm, 'no_phone'))
                continue

            updates = []
            params = []
            if se is not None and str(se).strip() != 'nan':
                updates.append('se = %s')
                params.append(se)
            if zsm is not None and str(zsm).strip() != 'nan':
                updates.append('zsm = %s')
                params.append(zsm)
            if zbm is not None and str(zbm).strip() != 'nan':
                updates.append('zbm = %s')
                params.append(zbm)

            if not updates:
                continue

            params.append(phone)
            sql = f"UPDATE public.app_users SET {', '.join(updates)}, updated_at = now() WHERE phone_number = %s RETURNING id"

            if args.dry_run:
                print('DRY', phone, se, zsm, zbm)
                continue

            cur.execute(sql, params)
            res = cur.fetchone()
            if res:
                updated_count += 1
                continue

            sql2 = f"UPDATE public.airtelmoney_agents SET {', '.join(updates)}, updated_at = now() WHERE phone = %s RETURNING id"
            cur.execute(sql2, params)
            res2 = cur.fetchone()
            if res2:
                updated_count += 1
                continue

            unmatched_rows.append((row.get('phone'), se, zsm, zbm, 'no_match'))

        if not args.dry_run:
            conn.commit()

    finally:
        cur.close()
        conn.close()

    print(f'Updated rows: {updated_count}')
    if unmatched_rows:
        out = Path('mappings_unmatched.csv')
        with out.open('w', newline='', encoding='utf-8') as fh:
            w = csv.writer(fh)
            w.writerow(['phone_raw', 'se', 'zsm', 'zbm', 'reason'])
            w.writerows(unmatched_rows)
        print('Wrote unmatched rows to', out)


if __name__ == '__main__':
    main()
