#!/bin/bash

set -e
cd "`dirname $0`"

rm -rf shadcn-event-calendar/src/components/ui
git checkout -- shadcn-event-calendar/src/App.tsx
git checkout -- shadcn-event-calendar/package.json

# TODO: pnpm install?
