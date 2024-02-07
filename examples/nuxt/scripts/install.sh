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
mkdir -p 'node_modules/@fullcalendar/vue'
cp -r ../../contrib/vue2/package.json 'node_modules/@fullcalendar/vue/package.json'
cp -r ../../contrib/vue2/src 'node_modules/@fullcalendar/vue/src'
cp -r ../../contrib/vue2/dist 'node_modules/@fullcalendar/vue/dist'
