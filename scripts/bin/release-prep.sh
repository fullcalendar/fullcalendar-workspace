#!/bin/bash

set -e
cd "`dirname $0`/../.."

pnpm run clean --all
pnpm run lint --all

pnpm run version-bump
# undo commit that changesets made
git reset HEAD~1

pnpm run build --all

# NOTE: the `pnpm run test --all` command was running recursively in standard :(
pnpm \
  --filter '!./standard' \
  --stream \
  run test

echo
echo "Done with release-prep!"
echo "Remember to clear modifications to the working tree!"
echo
