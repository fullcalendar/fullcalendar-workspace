# Converting Theme Source to React + Tailwind Components

This document describes how to convert theme source files into standalone React components with inlined Tailwind CSS classNames.

## Overview

**Input**: Theme source files located in `<repo-root>/theming/theme-*/src/`
**Output**: Generated React components in `<repo-root>/theming/ui-default-react/src/_gen-tailwind/theme-*/`

The conversion process transforms modular, options-based theme definitions into self-contained React components where all Tailwind classNames are inlined directly into component props.

## Directory Structure

### Source Files

Theme source code is located in `<repo-root>/theming/theme-*/src/`, where `*` represents the theme's casual name.

**Primary source files:**
- `./src/options-event-calendar.ts` - Event calendar styling options
- `./src/options-scheduler.ts` - Scheduler-specific styling options
- `./src/slots.tsx` - Slot content definitions

**UI library source files (for "default" UI):**
- `./src/ui-default-options-event-calendar.ts` - Default UI event calendar options
- `./src/ui-default-options-scheduler.ts` - Default UI scheduler options
- `./src/ui-default-options-svgs.tsx` - SVG icon definitions

### Output Location

Generated files are output to:
- `<repo-root>/theming/ui-default-react/src/_gen-tailwind/theme-*/`
- `event-calendar.tsx` - Standalone EventCalendar component
- `scheduler.tsx` - Standalone Scheduler component (calls EventCalendar)

## General Conversion Rules

### TypeScript Type Handling

**Do NOT** add `: any` type annotations to fix TypeScript errors. The TypeScript setup is finicky and types will eventually be inferred correctly. Leave type errors as-is.

### Constant Preservation

**Preserve constants** from source files rather than inlining them:

- **From primary source files** (`options-event-calendar.ts`, `options-scheduler.ts`): Preserve all `const` definitions. Examples: `blockPointerResizerClass`, `dayRowCommonClasses`, `getNormalDayHeaderBorderClass`.

- **From UI-default source files** (`ui-default-options-event-calendar.ts`, etc.): Preserve all `const` definitions. Examples: `primaryPressableClass`, `eventMutedFgClass`, `strongSolidPressableClass`, `bgEventBgClass`.

- **Type annotations**: When preserving constants, also preserve any TypeScript type annotations from the source (e.g., `DayHeaderData`, `DayCellData`, `CalendarOptions`).

### String Literals

- **Use regular quotes** (`'` or `"`) instead of template literals (backticks) unless the string contains interpolation (`${...}`).

- **JSX props**: Use literal string props (e.g., `propName='value'`) rather than wrapping in curly braces (e.g., `propName={'value'}` or `propName={\`value\`}`).

- **Single quotes for JSX**: Always use single quotes for JSX string props (e.g., `propName='value'`) instead of double quotes.

### Comments

**Preserve:**
- Large block-style section delimiter comments (e.g., `/* Toolbar */`). Merge same-named sections across files when appropriate.
- Section comments that precede groups of related statements (e.g., `// circle resizer for touch` before touch resizer constants, `// transparent resizer for mouse` before pointer resizer constants).

**Remove:**
- Comments describing where constants came from (e.g., `// Constants from params`).
- Generic organizational comments (e.g., `// Presets`, `// SVG helper functions`).

**Formatting**: When preserving large block-style comments, ensure the separator line (`---- */`) ends at exactly the 100th column.

### SVG Functions

SVG-generating functions (functions that return JSX/TSX SVG elements) should be:
- Placed at the bottom of generated files, after the main component function.
- Labeled with a large block-style comment: `/* SVGs */` (separator line ending at column 100).
- Exported if used in other files (e.g., `chevronDown` exported from `event-calendar.tsx` for use in `scheduler.tsx`).

Function declarations are hoisted, so they work correctly even when defined after usage.

## EventCalendar Component Conversion

### Step 1: Inline `createSlots` Call

Evaluate the `createSlots` call from `slots.tsx`:
- Inline everything from `params` into the slot function definitions.
- Replace `createElement` and `Fragment` imports with React equivalents (they were originally from Preact).
- Convert slot functions to direct component props (e.g., `dayHeaderContent`).

### Step 2: Inline `defaultUiEventCalendarOptions`

Copy all props from `defaultUiEventCalendarOptions.optionDefaults` and inline them as direct props to the `FullCalendar` component. Replace any `params` references with actual Tailwind classNames.

### Step 3: Copy Presets as Top-Level Constants

Copy `eventCalendarAvailableViews` and `eventCalendarPlugins` into the file, keeping them as top-level exported constants.

### Step 4: Merge View Options

The `createEventCalendarOptions()` function returns view-specific settings. Instead of using `mergeViewOptionsMap`, manually merge user-provided views like this:

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

**Important**: Spread `userViews` first to allow custom view names that aren't in the predefined list to pass through.

### Step 5: Prop Ordering

Ensure props are ordered correctly:
- **Top of props** (before any section comments): `initialView`, `plugins`
- **In `/* Toolbar */` section**: `headerToolbar`, `buttons`
- **Content props** (from slots): Place at the end of their respective sections (e.g., `dayHeaderContent` at end of `/* Day Header */` section)

### Step 6: Parameter Destructuring

When extracting props to avoid conflicts when spreading `calendarOptions`, perform destructuring directly in the function parameter list:

```ts
export function EventCalendar({
  buttons: userButtons,
  views: userViews,
  plugins: userPlugins,
  ...restOptions
}: EventCalendarProps) {
  // ...
}
```

Use `restOptions` as the name for the rest parameter (not `restCalendarOptions` or `restProps`).

## Scheduler Component Conversion

### Step 1: Import EventCalendar

Import `EventCalendar` from the generated `event-calendar.tsx` file:

```ts
import { EventCalendar, /* exported constants */ } from './event-calendar.js'
```

### Step 2: Inline `defaultUiSchedulerOnlyOptions`

Copy all props from `defaultUiSchedulerOnlyOptions.optionDefaults` and inline them as direct props to the `EventCalendar` component.

### Step 3: Copy Presets as Top-Level Constants

Copy `schedulerAvailableViews` and `schedulerOnlyPlugins` into the file, keeping them as top-level exported constants.

### Step 4: Merge Plugins and Views

**Critical**: Extract `plugins` via parameter destructuring before spreading `restOptions`. Otherwise, if `plugins` is passed as a prop, it will override your merged plugins array:

```ts
export function Scheduler({
  availableViews = schedulerAvailableViews,
  addButton,
  plugins: userPlugins,  // Extract via destructuring
  views: userViews,      // Extract via destructuring
  ...restOptions
}: SchedulerProps) {
  return (
    <EventCalendar
      availableViews={availableViews}
      addButton={addButton}
      plugins={[
        ...schedulerOnlyPlugins,
        ...(userPlugins || []),
      ]}
      views={{
        ...userViews,  // Spread first for custom views
        // ... predefined views
      }}
      {...restOptions}
    />
  )
}
```

### Step 5: Prop Ordering

Ensure props passed to `EventCalendar` are ordered correctly:
- **Top of props**: `availableViews`, `addButton`, `plugins`
- **Then**: All other props organized by section comments

## Code Style Summary

- ✅ Use single quotes for JSX props: `propName='value'`
- ✅ Use regular quotes for strings without interpolation: `'string'` not `` `string` ``
- ✅ Use template literals only when needed: `` `prefix ${variable} suffix` ``
- ✅ Preserve constants from source files (except `popoverClass` and `popoverHeaderClass`)
- ✅ Preserve TypeScript type annotations from source
- ✅ Preserve large block-style section comments (format separator to column 100)
- ✅ Place SVG functions at bottom of file with `/* SVGs */` comment
- ✅ Use `restOptions` for rest parameter name
- ✅ Extract conflicting props via parameter destructuring
