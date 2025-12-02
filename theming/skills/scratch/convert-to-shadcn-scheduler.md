converting
  /theming/ui-shadcn-dev/src/theme-*/scheduler.tsx -> /theming/ui-shadcn-dev/src/theme-*/_gen/scheduler.tsx

Do the same instructions I wrote at the top of event-calendar.tsx, but for this file.
Output should be _gen/scheduler.tsx
Instead of inline all consts afresh, try to export and reuse what's already in _gen/event-calendar.tsx
When merging props, ensure resourceExpanderContent goes right after resourceExpanderClass
