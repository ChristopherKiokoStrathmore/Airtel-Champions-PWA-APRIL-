#!/usr/bin/env python3
"""Update sales hierarchy mappings from Excel into PostgreSQL.

Usage:
  python scripts/update_mappings.py --file path/to/file.xlsb --db-url "$DATABASE_URL"

Behaviour:
  - Reads Excel files (.xlsb/.xlsx/.xls), defaulting to first sheet.
  - Detects phone/SE/ZSM/ZBM/zone columns with case-insensitive fuzzy matching.
  - Updates app_users by phone (zsm, zbm, zone only).
  - Updates airtelmoney_agents by phone (se, zsm, zone).
  - Writes unmatched rows report for reconciliation.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import os
import re
import sys
from pathlib import Path

import pandas as pd
import psycopg2


def norm_phone(value: object) -> str:
    if value is None:
        return ''
    digits = re.sub(r'\D', '', str(value))
    if not digits:
        return ''
    # Keep last 9 digits to align with app login normalization.
    return digits[-9:] if len(digits) >= 9 else digits


def clean_cell(value: object) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    if not s or s.lower() == 'nan':
        return None
    return s


def find_column(columns: list[str], candidates: list[str]) -> str | None:
    cols = {c.lower(): c for c in columns}
    for cand in candidates:
        hit = cols.get(cand.lower())
        if hit:
            return hit
    for col in columns:
        low = col.lower()
        for cand in candidates:
            if cand.lower() in low:
                return col
    return None


def load_dataframe(file_path: Path, sheet_name: str | None) -> pd.DataFrame:
    engine = 'pyxlsb' if file_path.suffix.lower() == '.xlsb' else None
    return pd.read_excel(file_path, engine=engine, sheet_name=sheet_name)


def write_unmatched_report(rows: list[tuple], output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    ts = dt.datetime.now().strftime('%Y%m%d_%H%M%S')
    out = output_dir / f'mappings_unmatched_{ts}.csv'
    with out.open('w', newline='', encoding='utf-8') as fh:
        writer = csv.writer(fh)
        writer.writerow(['phone_raw', 'phone_norm', 'se', 'zsm', 'zbm', 'zone', 'reason'])
        writer.writerows(rows)
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--file', '-f', required=True, help='Path to Excel mapping file.')
    parser.add_argument('--sheet-name', help='Optional sheet name. Defaults to first sheet.')
    parser.add_argument('--db-url', '-d', default=os.environ.get('DATABASE_URL'))
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument(
        '--report-dir',
        default='artifacts/mapping_reports',
        help='Directory for unmatched reports.',
    )
    args = parser.parse_args()

    if not args.db_url:
        print('Error: DB URL must be provided via --db-url or DATABASE_URL env var', file=sys.stderr)
        return 2

    file_path = Path(args.file)
    if not file_path.exists():
        print(f'Error: file not found: {file_path}', file=sys.stderr)
        return 2

    try:
        df = load_dataframe(file_path, args.sheet_name)
    except Exception as exc:
        print(f'Error reading Excel file: {exc}', file=sys.stderr)
        return 2

    if df.empty:
        print('No rows found in file.')
        return 0

    columns = list(df.columns)
    phone_col = find_column(columns, ['phone', 'phone_number', 'msisdn', 'mobile', 'contact', 'phone no'])
    se_col = find_column(columns, ['se', 'tse', 'tse/se', 'sales exec', 'sales executive'])
    zsm_col = find_column(columns, ['zsm'])
    zbm_col = find_column(columns, ['zbm'])
    zone_col = find_column(columns, ['zone', 'region'])

    if not phone_col:
        print('Could not find phone column. Available columns:', columns, file=sys.stderr)
        return 2

    selected = [c for c in [phone_col, se_col, zsm_col, zbm_col, zone_col] if c is not None]
    df = df[selected].rename(
        columns={
            phone_col: 'phone_raw',
            se_col: 'se',
            zsm_col: 'zsm',
            zbm_col: 'zbm',
            zone_col: 'zone',
        }
    )
    df['phone_norm'] = df['phone_raw'].apply(norm_phone)

    # Keep the latest row per phone in case the sheet has duplicates.
    df = df[df['phone_norm'] != ''].drop_duplicates(subset=['phone_norm'], keep='last')
    if df.empty:
        print('No valid phone values found after normalization.')
        return 0

    conn = psycopg2.connect(args.db_url)
    cur = conn.cursor()

    stats = {
        'total_rows': int(df.shape[0]),
        'app_users_rows': 0,
        'airtelmoney_agents_rows': 0,
        'unmatched_rows': 0,
    }
    unmatched_rows: list[tuple] = []

    try:
        for _, row in df.iterrows():
            phone_norm = row.get('phone_norm')
            phone_raw = row.get('phone_raw')
            se_val = clean_cell(row.get('se'))
            zsm_val = clean_cell(row.get('zsm'))
            zbm_val = clean_cell(row.get('zbm'))
            zone_val = clean_cell(row.get('zone'))

            app_set = []
            app_params: list[str] = []
            if zsm_val:
                app_set.append('zsm = %s')
                app_params.append(zsm_val)
            if zbm_val:
                app_set.append('zbm = %s')
                app_params.append(zbm_val)
            if zone_val:
                app_set.append('zone = %s')
                app_params.append(zone_val)

            agent_set = []
            agent_params: list[str] = []
            if se_val:
                agent_set.append('se = %s')
                agent_params.append(se_val)
            if zsm_val:
                agent_set.append('zsm = %s')
                agent_params.append(zsm_val)
            if zone_val:
                agent_set.append('zone = %s')
                agent_params.append(zone_val)

            if not app_set and not agent_set:
                unmatched_rows.append((phone_raw, phone_norm, se_val, zsm_val, zbm_val, zone_val, 'no_mapping_values'))
                continue

            if args.dry_run:
                print(
                    'DRY',
                    {
                        'phone_norm': phone_norm,
                        'se': se_val,
                        'zsm': zsm_val,
                        'zbm': zbm_val,
                        'zone': zone_val,
                    },
                )
                continue

            app_count = 0
            if app_set:
                app_sql = (
                    f"UPDATE public.app_users SET {', '.join(app_set)}, updated_at = now() "
                    "WHERE right(regexp_replace(phone_number, '[^0-9]', '', 'g'), 9) = %s"
                )
                cur.execute(app_sql, [*app_params, phone_norm])
                app_count = cur.rowcount

            agent_count = 0
            if agent_set:
                agent_sql = (
                    f"UPDATE public.airtelmoney_agents SET {', '.join(agent_set)}, updated_at = now() "
                    "WHERE right(regexp_replace(phone, '[^0-9]', '', 'g'), 9) = %s"
                )
                cur.execute(agent_sql, [*agent_params, phone_norm])
                agent_count = cur.rowcount

            stats['app_users_rows'] += app_count
            stats['airtelmoney_agents_rows'] += agent_count

            if app_count == 0 and agent_count == 0:
                unmatched_rows.append((phone_raw, phone_norm, se_val, zsm_val, zbm_val, zone_val, 'no_match'))

        if not args.dry_run:
            conn.commit()
    except Exception:
        if not args.dry_run:
            conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

    stats['unmatched_rows'] = len(unmatched_rows)
    print('Mapping update summary:')
    print(f"  Source file: {file_path}")
    print(f"  Rows processed: {stats['total_rows']}")
    print(f"  app_users rows updated: {stats['app_users_rows']}")
    print(f"  airtelmoney_agents rows updated: {stats['airtelmoney_agents_rows']}")
    print(f"  Unmatched rows: {stats['unmatched_rows']}")

    if unmatched_rows:
        report_path = write_unmatched_report(unmatched_rows, Path(args.report_dir))
        print(f'Unmatched report: {report_path}')

    return 0


if __name__ == '__main__':
    sys.exit(main())
