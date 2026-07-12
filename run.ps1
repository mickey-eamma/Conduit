$ErrorActionPreference = 'Stop'
$frontendDir = Join-Path $PSScriptRoot 'frontend'
Set-Location -Path $frontendDir

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Node.js is not installed." -ForegroundColor Red
    Write-Host "Please run setup.bat first."
    exit 1
}

if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
    Write-Host "Dependencies are not installed yet. Installing now..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install failed. See the errors above." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting Conduit..." -ForegroundColor Green
Write-Host "The app will open in your browser shortly. Close this window to stop it."

Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process 'http://localhost:5173'
} | Out-Null

npm run dev
