#!/bin/bash

set -e
cd "`dirname $0`/.."

pnpm dlx shadcn@latest add "@fullcalendar-breezy/event-calendar"
# pnpm dlx shadcn@latest add "@fullcalendar-classic/event-calendar"
# pnpm dlx shadcn@latest add "@fullcalendar-forma/event-calendar"
# pnpm dlx shadcn@latest add "@fullcalendar-monarch/event-calendar"
# pnpm dlx shadcn@latest add "@fullcalendar-pulse/event-calendar"

pnpm run dev
