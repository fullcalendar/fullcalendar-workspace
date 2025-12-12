#!/bin/bash

set -e
cd "`dirname $0`/.."

rm -rf src/components/ui
git checkout -- src/App.tsx
git checkout -- package.json

echo
echo "SUCCESS in cleaning files"
echo "BUT, you'll still want to revert the PNPM lockfile and reinstall:"
echo
echo "  git checkout -- ../pnpm-lock.yaml && pnpm install"
echo
