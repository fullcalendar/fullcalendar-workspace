#!/bin/bash
#
# for bumping version use vscode search + replace:
# 1. "@fullcalendar/([\w-]+)": "\^([^"]*)" (with regexp support on)
#    "@fullcalendar/$1": "^6.1.10"
# 2. "fullcalendar(-scheduler)?": "\^([^"]*)" (with regexp support on)
#    "fullcalendar$1": "^6.1.10"
# 3. "@fullcalendar/([\w-]+)": "~([^"]*)" (with regexp support on)
#    "@fullcalendar/$1": "~6.1.10"
# 4. "fullcalendar(-scheduler)?": "~([^"]*)" (with regexp support on)
#    "fullcalendar$1": "~6.1.10"
# 5. "version": "6.1.9"
#    "version": "6.1.10"
#
# NOTE: also update github-release.sh
#

set -e
cd "`dirname $0`/../.."
root_dir=`pwd`

declare -a publish_dirs=( \
  "$root_dir/standard/packages/core" \
  "$root_dir/standard/packages/bootstrap5" \
  "$root_dir/standard/packages/daygrid" \
  "$root_dir/standard/packages/timegrid" \
  "$root_dir/standard/packages/google-calendar" \
  "$root_dir/standard/packages/icalendar" \
  "$root_dir/standard/packages/interaction" \
  "$root_dir/standard/packages/list" \
  "$root_dir/standard/packages/luxon1" \
  "$root_dir/standard/packages/luxon2" \
  "$root_dir/standard/packages/luxon3" \
  "$root_dir/standard/packages/moment" \
  "$root_dir/standard/packages/moment-timezone" \
  "$root_dir/standard/packages/rrule" \
  "$root_dir/standard/packages/web-component" \
  "$root_dir/standard/packages/multimonth" \
  "$root_dir/standard/bundle" \
  "$root_dir/premium/packages/premium-common" \
  "$root_dir/premium/packages/adaptive" \
  "$root_dir/premium/packages/resource" \
  "$root_dir/premium/packages/scrollgrid" \
  "$root_dir/premium/packages/resource-daygrid" \
  "$root_dir/premium/packages/timeline" \
  "$root_dir/premium/packages/resource-timegrid" \
  "$root_dir/premium/packages/resource-timeline" \
  "$root_dir/premium/bundle" \
  "$root_dir/contrib/react" \
  "$root_dir/contrib/angular" \
  "$root_dir/contrib/vue3" \
  "$root_dir/contrib/vue2" \
)

for publish_dir in ${publish_dirs[@]}; do
  cd "$publish_dir"
  pnpm publish --no-git-checks --access public
done
