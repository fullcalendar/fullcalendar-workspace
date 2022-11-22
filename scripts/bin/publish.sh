#!/bin/bash

# exit upon error
set -e

cd /Users/adam/Code/fullcalendar-workspace/standard/packages/core/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/bootstrap5/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/daygrid/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/timegrid/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/bootstrap/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/google-calendar/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/icalendar/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/interaction/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/list/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/luxon/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/luxon2/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/moment/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/moment-timezone/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/rrule/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/web-component/dist && pnpm publish
cd /Users/adam/Code/fullcalendar-workspace/standard/bundle/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/premium-common/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/adaptive/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/scrollgrid/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource-daygrid/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/timeline/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource-timegrid/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource-timeline/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/bundle/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/react/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/angular/dist/lib && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/vue3/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/vue2/dist && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace
