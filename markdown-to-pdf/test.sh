#!/bin/bash
set -e

# Default input file
DEFAULT_INPUT="/opt/data/wiki/System/Architecture.md"
INPUT="${1:-$DEFAULT_INPUT}"

# Generate output filename with timestamp
BASENAME=$(basename "$INPUT" .md)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BASENAME}_${TIMESTAMP}.pdf"

# Container path (what pandoc inside Docker writes to /opt/out mount)
OUTPUT_CONTAINER="/opt/out/${FILENAME}"

# Host paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$(cd "$SCRIPT_DIR/../../build/markdown-to-pdf" && pwd)"
ASSETS_DIR="$(cd "$SCRIPT_DIR/../../markdown-to-pdf" && pwd)"
OUTPUT_HOST="${ASSETS_DIR}/out/${FILENAME}"

echo "Input:    $INPUT"
echo "Output:   ${OUTPUT_HOST}"
echo ""

# Run the docker compose conversion from the build dir
cd "$BUILD_DIR"
if docker compose run --rm md-pdf "$INPUT" "$OUTPUT_CONTAINER"; then
    if [ -f "$OUTPUT_HOST" ]; then
        SIZE=$(du -h "$OUTPUT_HOST" | cut -f1)
        echo ""
        echo "✅ PDF generated: ${OUTPUT_HOST}"
        echo "   File size: $SIZE"
    else
        echo ""
        echo "⚠️  Docker command succeeded but output file not found"
        echo "   Checked: ${OUTPUT_HOST}"
        exit 1
    fi
else
    echo ""
    echo "❌ PDF generation failed for: $INPUT"
    exit 1
fi
