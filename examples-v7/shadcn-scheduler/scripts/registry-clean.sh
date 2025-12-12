#!/bin/bash

set -e
cd "`dirname $0`/.."

rm -rf src/components/ui
git checkout -- src/App.tsx
git checkout -- package.json

# go to monorepo root
cd ../..
git checkout -- pnpm-lock.yaml
pnpm install
