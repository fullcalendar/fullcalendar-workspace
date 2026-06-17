#!/usr/bin/env bash
set -e

# Get the directory where this script lives
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pkg_dir="$(dirname "$script_dir")"

# Remove old src and copy fresh from preact-scheduler
rm -rf "$pkg_dir/src"
cp -r "$pkg_dir/../preact-scheduler/src" "$pkg_dir/src"

# Replace @fullcalendar/preact with @fullcalendar/react in all source files
find "$pkg_dir/src" \
  -type f \( -name '*.ts' -o -name '*.tsx' \) \
  -exec sed -i.bak 's/@fullcalendar\/preact\//@fullcalendar\/react\//g' {} +
find "$pkg_dir/src" -type f -name '*.bak' -delete
