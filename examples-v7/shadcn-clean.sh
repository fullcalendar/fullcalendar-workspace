#!/bin/bash

set -e
cd "`dirname $0`"

rm -rf shadcn/src/components/ui
git checkout -- shadcn/src/App.tsx
git checkout -- shadcn/package.json

# TODO: pnpm install?
