#!/bin/bash

set -e

echo "#######"
echo "# CLEAN"
echo "#######"
echo
pnpm run clean --all

echo "###########"
echo "# INSTALL 1"
echo "###########"
echo
# important because writes tsconfigs
pnpm install

echo "#########"
echo "# BUILD 1"
echo "#########"
echo
pnpm --filter '!./examples/**' --filter '!./theming/**' run build

echo "###########"
echo "# INSTALL 2"
echo "###########"
echo
# for dependenciesMeta.*.injected
pnpm install

echo "#########"
echo "# BUILD 2"
echo "#########"
echo
pnpm --filter './examples/**' --filter './theming/**' run build

echo
echo "DONE"
echo
