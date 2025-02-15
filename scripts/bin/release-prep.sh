#!/bin/bash

set -e
cd "`dirname $0`/../.."

# # clean. for some reason standard-scripts was struggling here
# pnpm -r run clean
# pnpm -r exec rm -rf '.turbo'

pnpm run lint --all

pnpm run version-bump

pnpm --filter '!./examples/**' run build

# sync PNPM's dependenciesMeta.*.injected
pnpm install

pnpm --filter './examples/**' run build

# # for testing all contrib/example packages
# pnpm --stream run test --other

pnpm --stream run test

echo
echo "Done with release-prep!"
echo "Remember git-reset the modifications from the version-bump!"
echo
