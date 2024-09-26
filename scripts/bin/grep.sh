#!/bin/bash

set -e
cd "`dirname $0`/../.."

q=$1

if [ -z "$q" ]; then
  echo "Error: No search query provided"
  exit 1
fi

grep -n --color=auto -r -E "$q" */packages/*/src || true
grep -n --color=auto -r -E "$q" */tests/src || true
