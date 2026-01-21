#!/usr/bin/env bash
set -e

# Get the directory where this script lives
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pkg_dir="$(dirname "$script_dir")"

# Remove old src and copy fresh from preact
rm -rf "$pkg_dir/src"
cp -r "$pkg_dir/../preact/src" "$pkg_dir/src"

# Merge overrides into src (silently overwrite)
cp -r "$pkg_dir/src-overrides/." "$pkg_dir/src/"
