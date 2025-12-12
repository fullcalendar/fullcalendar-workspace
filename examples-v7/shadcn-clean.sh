#!/bin/bash

set -e
cd "`dirname $0`"
root_dir=`pwd`

cd "$root_dir/shadcn-event-calendar"
rm -rf src/components/ui
git checkout -- src/App.tsx
git checkout -- package.json

echo
echo "SUCCESS in cleaning files"
echo "BUT, you'll still want to revert the PNPM lockfile:"
echo
echo "  git checkout -- ../pnpm-lock.yaml"
echo
