#!/bin/bash
# Convert SVG logo to PNG for embedding in DOCX/PDF reports
# Requires: inkscape or imagemagick

SRC="public/assets/jr-farm-logo.svg"
DEST="public/assets/jr-farm-logo.png"

if command -v inkscape >/dev/null 2>&1; then
  inkscape "$SRC" --export-type=png --export-filename="$DEST" --export-width=400 --export-height=400
  echo "Converted SVG to PNG using Inkscape: $DEST"
elif command -v convert >/dev/null 2>&1; then
  convert -background none "$SRC" -resize 400x400 "$DEST"
  echo "Converted SVG to PNG using ImageMagick: $DEST"
else
  echo "Error: Please install Inkscape or ImageMagick to convert SVG to PNG."
  exit 1
fi
