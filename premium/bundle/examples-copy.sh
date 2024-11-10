#!/bin/bash

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define the SSH destination
DESTINATION="arshaw@fullcalendar-origin:/home/arshaw/arshaw-test/fullcalendar-premium"

# Use rsync with --relative to maintain directory structure
rsync -av --progress --relative \
  "$SCRIPT_DIR/./examples/"*.html \
  "$SCRIPT_DIR/./examples-v7/"*.html \
  "$SCRIPT_DIR/./examples-"*.html \
  "$SCRIPT_DIR/./dist/"* \
  "$DESTINATION"

echo "Files have been successfully copied to $DESTINATION"
