#!/bin/bash

# exit upon error
set -e

# always start in project root
cd "`dirname $0`/.."

npm install

rm -rf 'node_modules/@fullcalendar'
mkdir -p 'node_modules/@fullcalendar'
cp -r ../../standard/packages/core/dist 'node_modules/@fullcalendar/core'
cp -r ../../standard/packages/daygrid/dist 'node_modules/@fullcalendar/daygrid'
cp -r ../../standard/packages/interaction/dist 'node_modules/@fullcalendar/interaction'
cp -r ../../standard/packages/timegrid/dist 'node_modules/@fullcalendar/timegrid'
mkdir -p 'node_modules/@fullcalendar/vue3'
cp -r ../../contrib/vue3/package.json 'node_modules/@fullcalendar/vue3/package.json'
cp -r ../../contrib/vue3/src 'node_modules/@fullcalendar/vue3/src'
cp -r ../../contrib/vue3/dist 'node_modules/@fullcalendar/vue3/dist'
