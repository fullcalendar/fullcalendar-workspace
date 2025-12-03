
converting
  INPUT: /theming/ui-shadcn/src/theme-breezy/event-calendar.tsx
  OUTPUT: /theming/ui-shadcn/src/theme-breezy/_compiled/event-calendar.tsx

NOTE: you may be instructed to do this for a different theme other then breezy. If so, please replace all references to "breezy" in paths with the provided theme name. Here is the general form
  INPUT: /theming/ui-shadcn/src/theme-<themename>/event-calendar.tsx
  OUTPUT: /theming/ui-shadcn/src/theme-<themename>/_compiled/event-calendar.tsx

GOAL: use the input file as the "main" file and combine nearly all other files it references into a single file

DO inline all symbols from:
  @fullcalendar/theme-<themename>-tailwind
  @fullcalendar/theme-common
  Symbols from the /theming/ui-shadcn/src/lib directory
    (though inlining should NOT follow into the ../ui directory, as mentioned below)

Do NOT inline symbols from these files. Continue to import from external package:
  @fullcalendar/core
  @fullcalendar/react
  lucide-react
  Symbols from the /theming/ui-shadcn/src/ui directory

How far should inlining go?
- Attempt to evaluate the result of `createEventCalendarOptions`, which is a set of props (aka `params`). Inline those params directly into the JSX components' props.
  - Do NOT simply convert all params to consts and use those consts throughout the outputted file
  - Instead, INLINE the VALUE of each params. But do NOT recursively inline any consts that are referenced in those values. If the param value references a different const, please maintain the reference to that const.
- Same with the result of `createSlots`
- Do NOT inline the members of `dayRowCommonClasses`
- Some of the props from option-params.ts might not be used in the generated file. Ensure no resulting unused consts.

Notes on Typescript Types
- We have an unconventional Typescript setup that may produce false-positive type errors. Ignore all type errors
- In same vein, don't attempt to fix type errors by adding `: any` type hack. Especially do not do this for the `data` param you see.
- You might be copying functions like `getShortDayCellBottomClass`. Please move-over their parameters' type information too. These types will likely be imported from @fullcalendar/core, which should be kept external.
- When copying over `dayRowCommonClasses`, ensure the type for that const is preserved (`CalendarOptions`). This prevents TS errors for the params of its member functions.

Section Headers
  When spreading multiple props into the same set of props, keep the props grouped by the sections you see like this:

    /* Day Header
    ------------------------------------------------ */

  Those same sections and section blocks comments are present in the `views` map. Preserve those too:

    views: {
      timeGrid: {
        /* TimeGrid > Week Number Header
        ------------------------------------------------------------------------------- */
      }
    }

  But please do NOT create these types of block comment dividers on your own, based on prop names for example. Only copy over existing section comment dividers. For example, don't make "dayGrid" or "timeGrid" section headers just because they appear in the `views` map.

  Please also keep the header at the top of any `views`, that looks something like this:

    /* View-Specific Options
    ------------------------------------------------ */

  Merge same-name sections.

More notes on comments:
  Also keep the //-style comments at the tops of code blocks like this:

    // some comment
    const whatever = 'cool'
    const nice = 'yes'

Removing some blocks
  Remove blocks of code like this:
    // ambient types (tsc strips during build because of {})
    import {} from '@fullcalendar/daygrid'
    import {} from '@fullcalendar/timegrid'
    import {} from '@fullcalendar/list'
    // etc...

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

Augmenting `joinClassNames`
  Replace all calls to `joinClassNames` with the Shadcn `cn` utility that does something very similar. The import will likely look like this:

    import { cn } from '../../lib/utils.js'

Forced ordering of properties
  For the most part, you will order things based on when they occur in the "main" file and follow dependencies depth-first. However, here are some special ways to order that should override this:
  - At the very top of component props should be these props if present:
    1. plugins
    2. initialView
    3. className
  - The prop-section `/* Popover ---- */` section should go right after the `/* Day Cell ---- */` section
  - In terms of the order of props WITHIN a section of props, if there's a "Content" prop like `dayHeaderContent`, that should go at the very end of the section.
  - If there's a `button` prop, ensure it goes after the `buttonClass` props
  - If there are SVG-generating functions like `chevronDown`, but these at the very END of the file. Use a large block-comment section divider like this:
    /* SVGs
    ------------------------------------------------ */

Forced ordering of components
  The resulting file will have multiple components. Please order them like so:
  - main component
  - toolbar component
  - view component

Whitespace
  For props WITHIN a section of props, please ensure no blank lines between props

Exporting consts for scheduler reuse
  When initially creating the event-calendar.tsx compiled file, do NOT export any consts or functions (except EventCalendarProps and the main component function). Wait until the scheduler.tsx conversion is requested. Only then, determine which consts/functions need to be exported from event-calendar.tsx for reuse in scheduler.tsx, and add those exports.


## Part 2: Converting the scheduler.tsx file

Do this only if explicitly asked.
Do the same instructions I wrote for converting event-calendar.tsx, but for scheduler.tsx instead.

converting
  INPUT: /theming/ui-shadcn/src/theme-breezy/scheduler.tsx
  OUTPUT: /theming/ui-shadcn/src/theme-breezy/_compiled/scheduler.tsx

Instead of inline all consts afresh, try to export and reuse what's already in _compiled/event-calendar.tsx
When merging props, ensure resourceExpanderContent goes right after resourceExpanderClass
