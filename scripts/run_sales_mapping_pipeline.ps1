param(
  [string]$FilePath,
  [string]$DownloadsPattern = 'Sitewise & Contact Updates*.xlsb',
  [switch]$UseLatestFromDownloads,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

function Get-EnvValueFromDotEnv {
  param([string]$Name)

  $envFile = Join-Path $repoRoot '.env'
  if (-not (Test-Path $envFile)) {
    return $null
  }

  $line = Get-Content $envFile | Where-Object { $_ -match "^$Name=" } | Select-Object -First 1
  if (-not $line) {
    return $null
  }

  return ($line -split '=', 2)[1].Trim()
}

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  $dotEnvDb = Get-EnvValueFromDotEnv -Name 'DATABASE_URL'
  if (-not [string]::IsNullOrWhiteSpace($dotEnvDb)) {
    $env:DATABASE_URL = $dotEnvDb
  }
}

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  throw 'DATABASE_URL is not set. Set it in environment or .env.'
}

if ([string]::IsNullOrWhiteSpace($FilePath) -or $UseLatestFromDownloads) {
  $downloadsDir = Join-Path $env:USERPROFILE 'Downloads'
  if (-not (Test-Path $downloadsDir)) {
    throw "Downloads directory not found: $downloadsDir"
  }

  $latest = Get-ChildItem -Path $downloadsDir -Filter $DownloadsPattern -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $latest) {
    throw "No file matched pattern '$DownloadsPattern' in $downloadsDir"
  }

  $FilePath = $latest.FullName
}

if (-not (Test-Path $FilePath)) {
  throw "Mapping file not found: $FilePath"
}

$pythonExe = Join-Path $repoRoot '.venv\Scripts\python.exe'
if (-not (Test-Path $pythonExe)) {
  $pythonExe = 'python'
}

$logsDir = Join-Path $repoRoot 'logs'
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$logPath = Join-Path $logsDir "sales_mapping_pipeline_$timestamp.log"

Write-Host "Using mapping file: $FilePath"
Write-Host "Log file: $logPath"

Push-Location $repoRoot
try {
  $args = @('scripts/update_mappings.py', '--file', $FilePath)
  if ($DryRun) {
    $args += '--dry-run'
  }

  & $pythonExe @args 2>&1 | Tee-Object -FilePath $logPath
  if ($LASTEXITCODE -ne 0) {
    throw "Pipeline failed with exit code $LASTEXITCODE"
  }

  Write-Host 'Sales mapping pipeline completed successfully.'
}
finally {
  Pop-Location
}
