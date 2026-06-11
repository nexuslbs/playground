#!/bin/bash
set -e

INPUT_MD="$1"
OUTPUT_PDF="$2"

# Validate both arguments are provided
if [ -z "$INPUT_MD" ] || [ -z "$OUTPUT_PDF" ]; then
    echo "Usage: $0 <INPUT_MD> <OUTPUT_PDF>"
    echo "  INPUT_MD   - Path to the input Markdown file"
    echo "  OUTPUT_PDF - Path where the output PDF will be written"
    exit 1
fi

# Check input file exists
if [ ! -f "$INPUT_MD" ]; then
    echo "Error: Input file does not exist: $INPUT_MD"
    exit 1
fi

# Extract title from first heading (# Title)
TITLE=$(head -1 "$INPUT_MD" | sed 's/^# //')

# Run pandoc to convert markdown to PDF
pandoc "$INPUT_MD" \
    --pdf-engine=weasyprint \
    --css=/assets/style.css \
    --from=gfm+smart \
    --to=pdf \
    --metadata title="$TITLE" \
    -o "$OUTPUT_PDF"

# If pandoc fails, the script will exit with its error code due to set -e
