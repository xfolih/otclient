# Build otclient.data + otclient.data.loader.js from YOUR files.
# Run after downloading GitHub build. Deploy .data + .loader.js together with the build.
#
# Usage: .\build-otclient-data.ps1 -SourceDir "C:\path\to\folder\with\init.lua,data,mods,modules"
# Output: otclient.data, otclient.data.loader.js in SourceDir (or -OutputDir)
#
# Requires: Docker (uses otclient-buildenv image) or emsdk in PATH

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceDir,
    [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"
$SourceDir = (Resolve-Path $SourceDir).Path
if ($OutputDir) { $OutputDir = (Resolve-Path $OutputDir).Path } else { $OutputDir = $SourceDir }

foreach ($r in @("init.lua", "data", "mods", "modules")) {
    if (-not (Test-Path (Join-Path $SourceDir $r))) {
        Write-Error "Missing: $r in $SourceDir"
    }
}

$RepoRoot = Split-Path $PSScriptRoot -Parent
$ImageName = "otclient-buildenv"

# Build buildenv image if needed
if (-not (docker images -q $ImageName 2>$null)) {
    Write-Host "Building otclient-buildenv image (first time, ~10 min)..." -ForegroundColor Yellow
    docker build -t $ImageName -f (Join-Path $RepoRoot "Dockerfile.buildenv") $RepoRoot
}

Write-Host "Creating otclient.data + otclient.data.loader.js from: $SourceDir" -ForegroundColor Cyan

$preloadArgs = @()
if (Test-Path (Join-Path $SourceDir "otclientrc.lua")) { $preloadArgs += "otclientrc.lua@otclientrc.lua" }
if (Test-Path (Join-Path $SourceDir "config.ini")) { $preloadArgs += "config.ini@config.ini" }
$preloadArgs += @("init.lua@init.lua", "data@data", "mods@mods", "modules@modules")
$preloadStr = ($preloadArgs | ForEach-Object { "--preload $_" }) -join " "

$cmd = "source /opt/emsdk/emsdk_env.sh 2>/dev/null; cd /workspace; python3 /opt/emsdk/upstream/emscripten/tools/file_packager.py otclient.data --js-output=otclient.data.loader.js $preloadStr && cp -f otclient.data otclient.data.loader.js /output/ && echo Done."

docker run --rm `
    -v "${SourceDir}:/workspace" `
    -v "${OutputDir}:/output" `
    $ImageName `
    /bin/bash -c $cmd

Write-Host ""
Write-Host "Done. otclient.data and otclient.data.loader.js are in: $OutputDir" -ForegroundColor Green
Write-Host "Deploy these together with otclient.html, otclient.js, otclient.wasm" -ForegroundColor Green
