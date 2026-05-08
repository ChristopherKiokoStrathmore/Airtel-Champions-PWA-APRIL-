Param()

$envFile = Join-Path $PSScriptRoot '..\.env'

function Get-EnvValue([string]$Name) {
  if (-not (Test-Path $envFile)) { return $null }

  $match = Get-Content $envFile | Where-Object { $_ -like "$Name=*" } | Select-Object -First 1
  if (-not $match) { return $null }

  return $match.Split('=', 2)[1].Trim()
}

$supabaseUrl = $env:VITE_SUPABASE_URL
if (-not $supabaseUrl) { $supabaseUrl = Get-EnvValue 'VITE_SUPABASE_URL' }

$supabaseKey = $env:VITE_SUPABASE_ANON_KEY
if (-not $supabaseKey) { $supabaseKey = Get-EnvValue 'VITE_SUPABASE_ANON_KEY' }

if (-not $supabaseUrl -or -not $supabaseKey) {
  Write-Error 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY'
  exit 2
}

$headers = @{ 
  apikey = $supabaseKey
  Authorization = "Bearer $supabaseKey"
  'Content-Type' = 'application/json'
}

$body = @{ 
  p_team_lead_id = '00000000-0000-0000-0000-000000000000'
  p_promoter_name = 'Smoke Test'
  p_msisdn = '0712345678'
} | ConvertTo-Json

$url = "$supabaseUrl/rest/v1/rpc/promoter_add_member"

try {
  $response = Invoke-WebRequest -Method Post -Uri $url -Headers $headers -Body $body -UseBasicParsing
  if ($response.StatusCode -ge 400) {
    Write-Error "promoter_add_member returned HTTP $($response.StatusCode)"
    exit 1
  }

  Write-Host "promoter_add_member is exposed (HTTP $($response.StatusCode))"
  exit 0
} catch {
  $statusCode = $null
  $responseBody = $null

  if ($_.Exception.Response) {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
  }

  if ($statusCode -eq 404 -and $responseBody -match 'PGRST202') {
    Write-Error 'promoter_add_member is missing from the live schema cache'
    exit 1
  }

  if ($statusCode -eq 400 -and $responseBody -match 'PGRST202') {
    Write-Error 'promoter_add_member is missing from the live schema cache'
    exit 1
  }

  if ($statusCode -ge 500) {
    Write-Error "promoter_add_member returned server error $statusCode"
    if ($responseBody) { Write-Error $responseBody }
    exit 1
  }

  if ($statusCode) {
    Write-Host "promoter_add_member returned HTTP $statusCode"
    if ($responseBody) { Write-Host $responseBody }
    exit 0
  }

  Write-Error $_.Exception.Message
  exit 1
}