#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")"

printf 'Starting shadcn cleanup in %s\n' "$PWD"

if [[ $# -gt 1 ]]; then
  printf 'Usage: %s [shadcn-event-calendar|shadcn-scheduler]\n' "${0##*/}" >&2
  exit 1
fi

if [[ $# -eq 1 ]]; then
  case "$1" in
    shadcn-event-calendar|shadcn-scheduler)
      dirs=("$1")
      ;;
    *)
      printf 'Unknown example directory: %s\n' "$1" >&2
      printf 'Usage: %s [shadcn-event-calendar|shadcn-scheduler]\n' "${0##*/}" >&2
      exit 1
      ;;
  esac
else
  dirs=(shadcn-event-calendar shadcn-scheduler)
fi

for dir in "${dirs[@]}"; do
  pkg="$dir/package.json"

  printf 'Updating %s\n' "$pkg"
  node - "$pkg" <<'NODE'
const fs = require('fs');
const path = process.argv[2];

const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
const deps = pkg.dependencies || {};

delete deps['@fullcalendar/react'];
delete deps['@fullcalendar/react-scheduler'];
delete deps['temporal-polyfill'];

pkg.dependencies = deps;
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
NODE
  printf 'Updated dependencies in %s\n' "$pkg"

  components="$dir/components.json"
  printf 'Updating %s\n' "$components"
  node - "$components" <<'NODE'
const fs = require('fs');
const path = process.argv[2];
const from = 'https://shadcn-registry.fullcalendar.io/';
const to = 'http://localhost:3000/';

const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const registries = data.registries;
let matches = 0;

function replaceStrings(value) {
  if (typeof value === 'string') {
    if (value.includes(from)) {
      matches += 1;
      return value.split(from).join(to);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(replaceStrings);
  }

  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      value[key] = replaceStrings(value[key]);
    }
  }

  return value;
}

if (!registries || typeof registries !== 'object' || Array.isArray(registries)) {
  throw new Error(`Missing registries object in ${path}`);
}

replaceStrings(registries);

fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
if (matches === 0) {
  console.log(`No registry URL replacements needed in ${path}`);
} else {
  console.log(`Replaced ${matches} value(s) in ${path}`);
}
NODE
  printf 'Updated registry URL(s) in %s\n' "$components"

  printf 'Removing %s/src/components\n' "$dir"
  rm -rf "$dir/src/components"
  printf 'Removed %s/src/components\n' "$dir"
done

printf 'Running pnpm install\n'
pnpm install
printf 'Finished pnpm install\n'
