#!/bin/bash

set -e
cd "`dirname $0`/.."

theme="monarch"
host="http://localhost:3000"

pnpm dlx shadcn@latest add "$host/$theme/scheduler.json"

pnpm run dev
