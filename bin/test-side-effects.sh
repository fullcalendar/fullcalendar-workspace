#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

# clean and rebuild core repo
cd fullcalendar
npm run clean
npm run dist

# copy over files to core repo
# (important to do this after the clean)
cd ..
gulp setup-test-side-effects

# run tests within core repo
cd fullcalendar
npm run test
