
All paths in this document are relative to the repo root


## General code-merging notes

Do NOT correct any typescript errors that say `data` is missing a type. That is a quirk with our TS setup.

You can safely remove the code block titled with the comment "// ambient types" because those types are now imported via fullcalendar plugins.

Inline the result of `createEventCalendarOptions`. Do NOT keep the intermediate const `baseEventCalendarOptions`.

Inline the result of `createSlots`. Do NOT keep the intermediate const `slots`.

Inline all values from the `params` const. Instead of accessing `params.whatever` throughout the code, replace each usage with the actual inline value. Remove the `params` const entirely after inlining all its values.

Please preserve ALL OTHER `const` variables from the original files! Do NOT inline their values into the component props.




### Combining Sections

Both the original `createEventCalendarOptions` and `createSlots` functions organize props by section, like:

```js
/* Abstract Event
------------------------------------------------ */

aProp: '',
bProp: '',

/* Day Header
------------------------------------------------ */

cProp: '',
dProp: '',
```

When merging them into the same props, **you MUST preserve these section block comments**.

Futhermore, when multiple files define the same sections, please merge the sections rather than include duplicate sections.

The same exact merging concepts apply to sections in the `views` map, like this:

```js
views: {
  /* List-View
  ------------------------------------------------ */

  aProp: '',
  bProp: '',

  /* Timeline
  ------------------------------------------------ */

  cProp: '',
  dProp: '',
}
```

The *order* of the sections is determined by the source file that first defines each one. The precendence of source file can be seen in each "Combine" list of files below.

For ordering props *within sections*, prioritize props that are defined in earlier files in the "Combine" list as well.




### Combining `view` options

Merging `userViews` or `calendarOptions.views` is a little tricky. Instead of relying on `mergeViewOptionsMap`, do something like this:

```js
views={{
  ...userViews,  // Spread user views first to allow custom view names
  dayGrid: {
    /* base day-grid-view settings */
    ...userViews?.dayGrid,
  },
  timeGrid: {
    /* base time-grid-view settings */
    ...userViews?.timeGrid,
  },
  // ... other views
}}
```


### Default UI: Combining button maps

When spreading `userButtons`, which is a possibly-undefined object, you don't need to `|| {}` to guarantee an object. The native object spread will success nonetheless.





For spreading the rest props `calendarOptions`, destructure `userPlugins`, `userButtons`, and `userViews`. Then safely spread the rest of `calendarOptions`, which you should call `restOptions` into the component's main props at the very end. You can all of this within the param list of the function and thus elminiate the `calendarOptions` entirely. Do NOT destructure `calendarOptions` as a seperate first statement within the function.





Formatting:
After merging all props, you can remove whitespace lines between props. The same can be said for props in intermediate objects like `dayRowCommonClasses`.
But please keep whitespace lines before and after the prop-section comments.

## React + Default UI

Generate files:

- theming/ui-default-react/src/_gen-tailwind/theme-breezy2/event-calendar.tsx
  - Combine:
    - theming/ui-default-react/src/theme-breezy/event-calendar.tsx (main entrypoint)
    - theming/ui-default-react/src/lib/event-calendar-presets.ts
    - theming/theme-breezy/src/ui-default-options-event-calendar.ts
    - theming/theme-breezy/src/ui-default-svgs.tsx
    - theming/theme-breezy/src/options-event-calendar.ts
    - theming/theme-breezy/src/slots.tsx
  - Special props that should be at the very top of the component:
    - plugins
    - initialView
  - Ordering: the meat of the resulting file will be theming/theme-breezy/src/options-event-calendar.ts + slots.tsx, but there will be consts and functions preserved from the other files. Here is how you should order those:
    - consts from theming/ui-default-react/src/lib/event-calendar-presets.ts
    - consts from theming/theme-breezy/src/ui-default-options-event-calendar.ts
    - consts and helper functions from theming/theme-breezy/src/options-event-calendar.ts (like `blockPointerResizerClass`, `getNormalDayHeaderBorderClass`, `dayRowCommonClasses`, etc.) - these should be in top-level scope, not inside the component function
    - interface definitions (EventCalendarProps, etc.)
    - component function
    - for functions from theming/theme-breezy/src/ui-default-svgs.tsx, put these AT THE BOTTOM of the generated file. Make a block style comment, simmilar to the others, that says /* SVGs ---- */
- theming/ui-default-react/src/_gen-tailwind/theme-breezy2/scheduler.tsx
  - Combine:
    - theming/ui-default-react/src/theme-breezy/scheduler.tsx (main entrypoint)
    - theming/ui-default-react/src/lib/scheduler-presets.ts
    - theming/theme-breezy/src/ui-default-options-scheduler.ts
    - theming/theme-breezy/src/options-scheduler.ts
  - Special props that should be at the very top of the component:
    - plugins
    - availableViews
    - addButton
  - Import from the generated ./event-calendar.tsx:
    - EventCalendar
    - any SVG-generating functions originally present in ui-default-svgs.tsx
    - any classnames or other utilities that the generated event-calendar.tsx got from the source file ui-default-options-event-calendar.ts

scheduler.tsx should only exporting the component and component type. Nothing else.

After generating scheduler.tsx, go back to event-calendar.tsx and audit the exports. It should only be exporting the component, component types, and any utils that scheduler.tsx needs. No other exports.

Do NOT have event-calendar.tsx re-export members from any of the official fullcalendar packages, like joinClassNames. Have scheduler.tsx import those directly from the fullcalendar packages.

Ensure your preserve the "/* View-Specific" comment.


## React + ShadCN

theming/ui-shadcn/src/_gen-tailwind/theme-breezy2/event-calendar.tsx

Combine:
- theming/ui-shadcn/src/theme-breezy/event-calendar.tsx (main entrypoint)
- theming/ui-shadcn/src/lib/option-params.ts
- theming/ui-shadcn/src/lib/event-calendar-presets.ts
- theming/ui-shadcn/src/lib/event-calendar-icons.ts
- theming/ui-shadcn/src/lib/event-calendar-toolbar.ts
- theming/theme-breezy/src/options-event-calendar.ts
- theming/theme-breezy/src/slots.tsx

theming/ui-shadcn/src/_gen-tailwind/theme-breezy2/scheduler.tsx

Combine:
- theming/ui-shadcn/src/theme-breezy/scheduler.tsx (main entrypoint)
- theming/ui-shadcn/src/lib/option-params.ts
- theming/ui-shadcn/src/lib/scheduler-presets.ts
- theming/ui-shadcn/src/lib/scheduler-icons.ts
- theming/theme-breezy/src/options-scheduler.ts
Import from the generated ./event-calendar.tsx:
- eventCalendarPlugins
- EventCalendarView
- EventCalendarToolbar
- any SVG-generating functions originally present in ui-default-svgs.tsx

TODO: joinClassNames -> cn
