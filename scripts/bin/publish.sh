#!/bin/bash

# exit upon error
set -e

# first-time publishes need `--access public`

cd /Users/adam/Code/fullcalendar-workspace/standard/packages/core && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/bootstrap5 && pnpm publish --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/daygrid && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/timegrid && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/bootstrap && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/google-calendar && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/icalendar && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/interaction && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/list && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/luxon && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/luxon2 && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/moment && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/moment-timezone && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/rrule && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/standard/packages/web-component && pnpm publish --no-git-checks
cd /Users/adam/Code/fullcalendar-workspace/standard/bundle && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/premium-common && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/adaptive && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/scrollgrid && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource-daygrid && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/timeline && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource-timegrid && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/packages/resource-timeline && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/premium/bundle && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/react && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/angular && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/vue3 && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace/contrib/vue2 && pnpm publish --no-git-checks --tag beta
cd /Users/adam/Code/fullcalendar-workspace
