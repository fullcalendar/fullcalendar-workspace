#!/bin/bash

set -e
cd "`dirname $0`/.."

pnpm dlx shadcn@latest add "@fullcalendar-breezy/scheduler"
# pnpm dlx shadcn@latest add "@fullcalendar-classic/scheduler"
# pnpm dlx shadcn@latest add "@fullcalendar-forma/scheduler"
# pnpm dlx shadcn@latest add "@fullcalendar-monarch/scheduler"
# pnpm dlx shadcn@latest add "@fullcalendar-pulse/scheduler"

pnpm run dev
