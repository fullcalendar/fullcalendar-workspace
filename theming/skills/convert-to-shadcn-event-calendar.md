converting
  /theming/ui-shadcn-dev/src/theme-*/event-calendar.tsx -> /theming/ui-shadcn-dev/src/theme-*/_gen/event-calendar.tsx

Take this file and transform it into a new file ./_gen/event-calendar.tsx
Inline all symbols from ../lib/, but keep them as consts/functions (do NOT inline their primitive values).
Exception: do NOT inline the cn() function. Refer to them in their original file.
Attempt to evaluate the result of createEventCalendarOptions, which is a set of props. Spread those props directly into the JSX components' props.
Same with the result of createSlots.
Some of the props from option-params.ts might not be used in the generated file. Ensure no resulting unused consts.
Do NOT inline any @fullcalendar packages.
Replace all uses if our joinClassNames function with the shadcn cn() function
When spreading multiple props into the same set of props, keep the props grouped by the sections you see like this:

  /* Day Header
  ------------------------------------------------

Those same sections and section blocks comments are present in the `views` map. Preserve those too:

  views: {
    /* Some View
    ------------------------------------------------
  }

Please also keep the header at the top of any `views`, that looks something like this:

  /* View-Specific Options
  ------------------------------------------------

Also keep the //-style comments at the tops of code blocks like this:

  // some comment
  const whatever = 'cool'
  const nice = 'yes'

Merge same-name sections.
For merging `userViews` or `views`, instead of relying on `mergeViewOptionsMap`, do something like this:

  views={{
    ...userViews,
    dayGrid: {
      prop0: '',
      prop1: '',
      ...userViews?.dayGrid,
    },
    timeGrid: {
      prop0: '',
      prop1: '',
      ...userViews?.timeGrid,
    },
  }}

The resulting file will have multiple components. Please order them like so:
  - main component
  - toolbar component
  - view component
