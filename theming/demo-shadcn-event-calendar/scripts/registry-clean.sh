#!/bin/bash

set -e
cd "`dirname $0`/.."

rm -rf src/components
git checkout -- package.json

echo
echo "Go to monorepo root and run pnpm-install"
echo
