#!/bin/bash

# exit upon error
set -e

cd /Users/adam/Code/fullcalendar-workspace/standard/packages/core && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/bootstrap5 && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/daygrid && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/timegrid && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/bootstrap && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/google-calendar && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/icalendar && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/interaction && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/list && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/luxon && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/luxon2 && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/moment && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/moment-timezone && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/rrule && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/web-component && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/bundle && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/premium-common && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/adaptive && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/scrollgrid && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource-daygrid && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/timeline && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource-timegrid && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource-timeline && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/bundle && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/react && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/angular && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/vue3 && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/vue2 && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace
