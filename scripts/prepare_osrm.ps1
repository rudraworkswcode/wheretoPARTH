# ==============================================================================
# where to PARTH — Local OSRM MLD Graph Preparation Script (PowerShell)
# Uses pinned Docker image ghcr.io/project-osrm/osrm-backend:v5.27.1
# ==============================================================================

param(
    [string]$DataDir = ".\osrm-data",
    [string]$PbfName = "karnataka-latest.osm.pbf"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}

$ResolvedDataDir = (Resolve-Path $DataDir).Path
$PbfPath = Join-Path $ResolvedDataDir $PbfName
$BaseName = $PbfName -replace '\.osm\.pbf$', ''
$OsrmImage = "ghcr.io/project-osrm/osrm-backend:v5.27.1"

Write-Host "=== where to PARTH: OSRM Graph Preparation ===" -ForegroundColor Cyan
Write-Host "Data Directory: $ResolvedDataDir"
Write-Host "Target PBF:     $PbfPath"
Write-Host "Pinned Image:   $OsrmImage"

if (-not (Test-Path $PbfPath)) {
    Write-Host "ERROR: OSM PBF file not found at '$PbfPath'." -ForegroundColor Red
    Write-Host "Please download an OSM PBF file (e.g. karnataka-latest.osm.pbf or southern-zone-latest.osm.pbf)" -ForegroundColor Yellow
    Write-Host "from https://download.geofabrik.de/asia/india.html and place it in '$ResolvedDataDir'." -ForegroundColor Yellow
    Write-Host "Usage: .\scripts\prepare_osrm.ps1 -DataDir .\osrm-data -PbfName karnataka-latest.osm.pbf" -ForegroundColor Yellow
    exit 1
}

Write-Host "--- Step 1/3: osrm-extract using /opt/car.lua ---" -ForegroundColor Green
docker run --rm -t -v "${ResolvedDataDir}:/data" $OsrmImage osrm-extract -p /opt/car.lua "/data/$PbfName"

Write-Host "--- Step 2/3: osrm-partition (MLD) ---" -ForegroundColor Green
docker run --rm -t -v "${ResolvedDataDir}:/data" $OsrmImage osrm-partition "/data/$BaseName.osrm"

Write-Host "--- Step 3/3: osrm-customize (MLD) ---" -ForegroundColor Green
docker run --rm -t -v "${ResolvedDataDir}:/data" $OsrmImage osrm-customize "/data/$BaseName.osrm"

Write-Host "=== Preparation Complete! ===" -ForegroundColor Cyan
Write-Host "OSRM graph files generated in '$ResolvedDataDir'."
Write-Host "You can now run: docker compose up"

