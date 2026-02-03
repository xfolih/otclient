# Rebuild otclient.data from YOUR files (init.lua, data, mods, modules)
# First run: full build ~30 min. Later runs when only data changed: ~2-5 min.
#
# Usage:
#   .\build-data-only.ps1 -SourceDir "C:\Users\Oliver\Desktop\wasm\github"
#
# SourceDir must contain: init.lua, data/, mods/, modules/ (+ otclientrc.lua, config.ini)
# Output: build-emscripten-web/ with otclient.html, .js, .wasm, .data

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceDir
)

$ErrorActionPreference = "Stop"
$SourceDir = (Resolve-Path $SourceDir).Path
$OutputDir = Join-Path $SourceDir "build-emscripten-web"
$ImageName = "otclient-buildenv"
$RepoRoot = Split-Path $PSScriptRoot -Parent

foreach ($r in @("init.lua", "data", "mods", "modules")) {
    if (-not (Test-Path (Join-Path $SourceDir $r))) {
        Write-Error "Missing: $r in $SourceDir"
    }
}

Write-Host "Building with YOUR data from: $SourceDir" -ForegroundColor Cyan

# Build buildenv image if needed
if (-not (docker images -q $ImageName 2>$null)) {
    Write-Host "First time: building otclient-buildenv image (~15 min)..." -ForegroundColor Yellow
    docker build -t $ImageName -f (Join-Path $RepoRoot "Dockerfile.buildenv") $RepoRoot
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Write-Host "Running build..." -ForegroundColor Cyan
docker run --rm `
    -v "${SourceDir}:/workspace" `
    -v "otclient-vcpkg:/opt/vcpkg/buildtrees" `
    -v "otclient-emsdk-cache:/opt/emsdk/upstream/emscripten/cache" `
    $ImageName `
    /bin/bash -c @'
set -e
cd /workspace
source /opt/emsdk/emsdk_env.sh
export VCPKG_ROOT=/opt/vcpkg

if [ ! -f build-emscripten/CMakeCache.txt ]; then
  echo "First run: full configure + build (~30 min)..."
  mkdir -p build-emscripten
  cmake -G Ninja -S . -B build-emscripten \
    -DWASM=ON -DWASM_EXTERNAL_DATA=OFF \
    -DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=/opt/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake \
    -DCMAKE_TOOLCHAIN_FILE=$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake \
    -DVCPKG_TARGET_TRIPLET=wasm32-emscripten-pthread \
    -DVCPKG_OVERLAY_TRIPLETS=/workspace/browser/triplets \
    -DVCPKG_OVERLAY_PORTS=/workspace/browser/overlay-ports \
    -DCMAKE_BUILD_TYPE=Release
  cmake --build build-emscripten --target otclient -j4
else
  echo "Incremental build (~2-5 min if only data changed)..."
  cmake --build build-emscripten --target otclient -j4
fi
echo "Build done. Output in build-emscripten/bin/"
'@

# Copy build output to output dir
$buildBin = Join-Path $SourceDir "build-emscripten\bin"
if (Test-Path $buildBin) {
    Copy-Item -Path "$buildBin\*" -Destination $OutputDir -Recurse -Force
}

Write-Host ""
Write-Host "Done. Deploy build-emscripten-web/ to your server." -ForegroundColor Green
