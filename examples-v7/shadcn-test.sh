#!/bin/bash

theme="monarch"
host="http://localhost:3000"

set -e
cd "`dirname $0`"
root_dir=`pwd`

cd "$root_dir/shadcn-event-calendar"
pnpm pnpm dlx shadcn@latest add "$host/breezy/event-calendar.json"
