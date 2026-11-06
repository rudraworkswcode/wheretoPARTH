#!/usr/bin/env bash
# ==============================================================================
# where to PARTH — Local OSRM MLD Graph Preparation Script
# Uses pinned Docker image ghcr.io/project-osrm/osrm-backend:v5.27.1
# ==============================================================================

set -euo pipefail

DATA_DIR="${1:-./osrm-data}"
PBF_NAME="${2:-karnataka-latest.osm.pbf}"

mkdir -p "$DATA_DIR"

PBF_PATH="$DATA_DIR/$PBF_NAME"
BASENAME="${PBF_NAME%.osm.pbf}"
OSRM_IMAGE="ghcr.io/project-osrm/osrm-backend:v5.27.1"

echo "=== where to PARTH: OSRM Graph Preparation ==="
echo "Data Directory: $DATA_DIR"
echo "Target PBF:     $PBF_PATH"
echo "Pinned Image:   $OSRM_IMAGE"

if [ ! -f "$PBF_PATH" ]; then
    echo "ERROR: OSM PBF file not found at '$PBF_PATH'."
    echo "Please download an OSM PBF file (e.g. karnataka-latest.osm.pbf or southern-zone-latest.osm.pbf)"
    echo "from https://download.geofabrik.de/asia/india.html and place it in '$DATA_DIR/'."
    echo "Usage: ./scripts/prepare_osrm.sh [data_dir] [pbf_filename]"
    exit 1
fi

echo "--- Step 1/3: osrm-extract using /opt/car.lua ---"
docker run --rm -t -v "$(cd "$DATA_DIR" && pwd):/data" "$OSRM_IMAGE" \
    osrm-extract -p /opt/car.lua "/data/$PBF_NAME"

echo "--- Step 2/3: osrm-partition (MLD) ---"
docker run --rm -t -v "$(cd "$DATA_DIR" && pwd):/data" "$OSRM_IMAGE" \
    osrm-partition "/data/$BASENAME.osrm"

echo "--- Step 3/3: osrm-customize (MLD) ---"
docker run --rm -t -v "$(cd "$DATA_DIR" && pwd):/data" "$OSRM_IMAGE" \
    osrm-customize "/data/$BASENAME.osrm"

echo "=== Preparation Complete! ==="
echo "OSRM graph files generated in '$DATA_DIR/'."
echo "You can now run: docker compose up"

