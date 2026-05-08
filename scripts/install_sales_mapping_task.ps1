param(
  [string]$TaskName = 'AirtelSalesMappingAutoUpdate',
  [string]$DailyTime = '06:00'
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$runnerPath = Join-Path $scriptDir 'run_sales_mapping_pipeline.ps1'

if (-not (Test-Path $runnerPath)) {
  throw "Runner script not found: $runnerPath"
}

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runnerPath`" -UseLatestFromDownloads"
$trigger = New-ScheduledTaskTrigger -Daily -At $DailyTime
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null

Write-Host "Scheduled task '$TaskName' installed."
Write-Host "It will run daily at $DailyTime and process the newest matching file from Downloads."
