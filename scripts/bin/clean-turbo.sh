#!/usr/bin/env bash

set -e # immediately exit upon error
cd "`dirname $0`/../.." # start in project root

rm -rf node_modules/.cache/turbo
find . -type d -name '.turbo' -exec rm -rf {} \;
