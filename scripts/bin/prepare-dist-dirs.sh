#!/bin/bash

set -e
cd "`dirname $0`/../.."
root_dir=`pwd`

mkdir -p premium/packages/angular-scheduler/dist
mkdir -p premium/packages/headless-grid/dist
mkdir -p premium/packages/preact-scheduler/dist
mkdir -p premium/packages/react-scheduler/dist
mkdir -p premium/packages/vanilla-scheduler/dist
mkdir -p premium/packages/vanilla-scheduler-tests/dist
mkdir -p premium/packages/vanilla-scheduler-w-react/dist
mkdir -p premium/packages/vue3-scheduler/dist
mkdir -p premium/packages/web-component-scheduler/dist

mkdir -p standard/packages/angular/dist/lib
mkdir -p standard/packages/bootstrap5/dist
mkdir -p standard/packages/google-calendar/dist
mkdir -p standard/packages/headless-calendar/dist
mkdir -p standard/packages/icalendar/dist
mkdir -p standard/packages/luxon3/dist
mkdir -p standard/packages/moment/dist
mkdir -p standard/packages/preact/dist
mkdir -p standard/packages/react/dist
mkdir -p standard/packages/rrule/dist
mkdir -p standard/packages/vanilla/dist
mkdir -p standard/packages/vanilla-tests/dist
mkdir -p standard/packages/vanilla-w-react/dist
mkdir -p standard/packages/vue3/dist
mkdir -p standard/packages/web-component/dist

mkdir -p theming/ui-mui/dist
