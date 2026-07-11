$ErrorActionPreference = 'Stop'

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Refresh-Path {
    $machine = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [System.Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user"
}

Set-Location -Path $PSScriptRoot

Write-Host "Conduit Setup" -ForegroundColor Green
Write-Host "This will install Node.js (if needed) and the app's dependencies."

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    Write-Step "Node.js is already installed ($(node --version))"
} else {
    Write-Step "Node.js not found. Installing..."

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
    } else {
        Write-Step "winget is not available, downloading the Node.js installer directly..."
        $index = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json'
        $lts = $index | Where-Object { $_.lts -ne $false } | Select-Object -First 1
        $version = $lts.version
        $arch = if ([Environment]::Is64BitOperatingSystem) { 'x64' } else { 'x86' }
        $msiUrl = "https://nodejs.org/dist/$version/node-$version-$arch.msi"
        $msiPath = Join-Path $env:TEMP "node-installer.msi"
        Write-Host "Downloading $msiUrl"
        Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath
        Write-Host "Installing Node.js $version ..."
        Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /qn /norestart" -Wait
        Remove-Item $msiPath -ErrorAction SilentlyContinue
    }

    Refresh-Path
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        Write-Host ""
        Write-Host "Node.js installation did not complete successfully." -ForegroundColor Red
        Write-Host "Please close this window, install Node.js manually from https://nodejs.org, then run setup.bat again."
        exit 1
    }
    Write-Step "Node.js installed ($(node --version))"
}

Write-Step "Installing app dependencies (npm install)..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "npm install failed. See the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setup complete! You can now start the app by double-clicking run.bat" -ForegroundColor Green
