converting
  /theming/ui-shadcn-dev/src/theme-*/event-calendar.tsx -> /theming/ui-shadcn-dev/src/theme-*/_gen/event-calendar.tsx
  Take this file and transform it into a new file ./_gen/event-calendar.tsx

Exception: do NOT inline the cn() function. Refer to them in their original file.
Replace all uses if our joinClassNames function with the shadcn cn() function

The resulting file will have multiple components. Please order them like so:
  - main component
  - toolbar component
  - view component
