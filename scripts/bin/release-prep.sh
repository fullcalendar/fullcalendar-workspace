#!/bin/bash

set -e
cd "`dirname $0`/../.."

# # clean. for some reason standard-scripts was struggling here
# pnpm -r run clean
# pnpm -r exec rm -rf '.turbo'

pnpm run lint --all

pnpm run version-bump

pnpm run build --all

pnpm --stream run test

echo
echo "Done with release-prep!"
echo "Remember to clear modifications from the version-bump!"
echo
