#!/bin/bash

set -e
cd "`dirname $0`/.."

pnpm dlx shadcn@latest add "@fullcalendar/monarch/event-calendar"

pnpm run dev
