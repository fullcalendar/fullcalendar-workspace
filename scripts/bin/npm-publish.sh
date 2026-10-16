#!/bin/bash

set -euo pipefail
cd "$(dirname "$0")/../.."

# Packages that ended with v6 publish to latest; packages that continue in v7 use legacy.
# Recursive pnpm publish skips private packages and versions already on npm, without creating Git tags.
latest_filters=()
legacy_filters=(--filter '!./examples/**')
while IFS= read -r package_name; do
  [[ -n "$package_name" ]] || continue
  latest_filters+=(--filter "$package_name")
  legacy_filters+=(--filter "!$package_name")
done < scripts/npm-latest-packages.txt

pnpm "${latest_filters[@]}" --recursive publish --no-git-checks --access public --tag latest "$@"
pnpm "${legacy_filters[@]}" --recursive publish --no-git-checks --access public --tag legacy "$@"
