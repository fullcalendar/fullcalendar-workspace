#!/bin/bash

set -e
cd "`dirname $0`/.."

pnpm dlx shadcn@latest add "@fullcalendar/monarch/scheduler"

pnpm run dev
