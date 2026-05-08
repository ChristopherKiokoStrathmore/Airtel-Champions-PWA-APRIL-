# Sales Mapping Auto-Update Pipeline

This pipeline updates sales mapping fields from the latest Excel file into database login source tables.

## What it updates

- `app_users`: `zsm`, `zbm`, `zone`
- `airtelmoney_agents`: `se`, `zsm`, `zone`

Matching is done by normalized phone number (last 9 digits), so `+2547...`, `07...`, and `7...` map to the same account.

## Source file expected

The automation runner looks for newest file in Downloads matching:

- `Sitewise & Contact Updates*.xlsb`

You can pass a specific file path manually too.

## One-time setup

1. Install Python dependencies:
   - `python -m pip install -r scripts/requirements.txt`
2. Set `DATABASE_URL` in your environment or in `.env`.
3. (Optional) Install daily scheduler task:
   - `powershell -ExecutionPolicy Bypass -File scripts/install_sales_mapping_task.ps1 -DailyTime 06:00`

## Run manually

Dry run:

- `powershell -ExecutionPolicy Bypass -File scripts/run_sales_mapping_pipeline.ps1 -UseLatestFromDownloads -DryRun`

Apply update:

- `powershell -ExecutionPolicy Bypass -File scripts/run_sales_mapping_pipeline.ps1 -UseLatestFromDownloads`

Use explicit file:

- `powershell -ExecutionPolicy Bypass -File scripts/run_sales_mapping_pipeline.ps1 -FilePath "C:\Users\User\Downloads\Sitewise & Contact Updates May 2026.xlsb"`

## Output artifacts

- Pipeline log files: `logs/sales_mapping_pipeline_YYYYMMDD_HHMMSS.log`
- Unmatched records: `artifacts/mapping_reports/mappings_unmatched_YYYYMMDD_HHMMSS.csv`

## Existing GitHub Action

The repository already has `.github/workflows/update_mappings.yml` for repo-based files under `mappings/`.
Use the local PowerShell runner when your source file lives in Windows Downloads.
