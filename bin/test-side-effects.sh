#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

# copy over files to core repo
gulp test-side-effects:clean
gulp test-side-effects:install

# run tests within core repo
# forward all params
cd fullcalendar
npm run test -- "$@"
