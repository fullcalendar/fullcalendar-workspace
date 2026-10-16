#!/bin/bash

set -euo pipefail

# One-time repair for v6.1.22 packages that did not continue as stable v7 packages.
# The shared list comes from a13431bb7, excluding @fullcalendar/core, which has a v7 types package.
# Preserve legacy/latest tags on core, React, and all other packages outside this list.
version='6.1.22'
package_list="$(dirname "$0")/../npm-latest-packages.txt"

# Read the list before invoking npm so its 2FA prompts retain the terminal as stdin.
packages=()
while IFS= read -r package_name; do
  [[ -n "$package_name" ]] || continue
  packages+=("$package_name")
done < "$package_list"

for package_name in "${packages[@]}"; do
  echo "Setting $package_name latest to $version..."
  npm dist-tag add "$package_name@$version" latest

  # Check first so the script can resume after a partial run without missing-tag errors.
  legacy_version=$(npm view "$package_name" dist-tags.legacy)
  if [[ -n "$legacy_version" ]]; then
    echo "Removing $package_name legacy tag..."
    npm dist-tag rm "$package_name" legacy
  fi
done
