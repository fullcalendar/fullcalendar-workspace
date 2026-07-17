# FullCalendar LWC Wrapper — Implementation Plan

## Context

Create a new package in the FullCalendar monorepo at `standard/packages/lwc/` that produces a Salesforce Lightning Web Component (LWC) wrapper around FullCalendar. The deliverable is a zip file (`fullcalendar-lwc-<version>.zip`) that Salesforce developers can unpack and copy into their SFDX project.

The wrapper component loads the FullCalendar IIFE build as a Salesforce static resource, instantiates a FullCalendar `Calendar` inside an LWC shadow DOM, and exposes a reactive `options` prop plus re-dispatched custom events.

Package versioning tracks the rest of the monorepo in lockstep. The vanilla `fullcalendar` package is a declared dependency; its built `dist/` is resolved at build time via Node's module resolution.

## Package layout

```
standard/packages/lwc/
├── package.json
├── tsconfig.json                    ← TS config for the build script only
├── README.md
├── src/                             ← LWC wrapper source (JS, not TS)
│   ├── fullCalendar.html
│   ├── fullCalendar.js
│   └── fullCalendar.js-meta.xml.template
├── scripts/
│   └── build.ts                     ← native Node TS build script (assembles zip)
├── tests/                           ← reserved for automated tests (none in v1)
├── dist/                            ← build output (gitignored)
└── README.md

standard/packages/lwc-example/       ← manual smoke-test Salesforce project
```

## Phase 1: Scaffold the package

1. Create `standard/packages/lwc/package.json`:
   - Name: `@fullcalendar/lwc` (match existing scope conventions)
   - `fullcalendar` declared as a dependency (workspace link in dev)
  - Dev deps: `typescript`, `archiver` (or `jszip`), `@lwc/eslint-plugin-lwc`
  - Single script: `"build": "./scripts/build.ts"`
2. Create `tsconfig.json` targeting `scripts/` only. Component source stays JS.
3. Keep the publishable `lwc` package free of Salesforce project config; the scratch-org smoke app lives in sibling package `standard/packages/lwc-example`.
4. Set up `.gitignore` for `dist/`.
5. Note on monorepo integration: the existing `turbo.json` already handles this package correctly — `build.dependsOn: ["^build"]` ensures `fullcalendar` builds first, and the existing input/output globs apply. No turbo config changes needed.

## Phase 2: Write the LWC wrapper component

Files live in `src/`:

### `fullCalendar.html`
```html
<template>
  <div lwc:ref="container"></div>
</template>
```

### `fullCalendar.js-meta.xml.template`

Template file that the build script will process, injecting the `themeAndPalette` datasource value. The template has a placeholder like `{{THEME_AND_PALETTE_DATASOURCE}}` that the build replaces with the comma-separated list of valid `theme/palette` combinations.

Key requirements:
- `<isExposed>true</isExposed>`
- Targets: `lightning__AppPage`, `lightning__RecordPage`, `lightning__HomePage`
- Design attributes:
  - `themeAndPalette` (String, with generated datasource of valid `theme/palette` combinations, defaulted to `classic/default`)
  - `locale` (String, free text — admin types the locale code)
- Do NOT expose `theme`, `options`, or `getCalendar()` as design attributes — those are for programmatic use only

### `fullCalendar.js`

Requirements:

1. **Props:**
   - `@api options` — FullCalendar options object (the primary API)
   - `@api themeAndPalette` — compound value such as `"forma/blue"` from App Builder
   - `@api themePalette` — individual palette name for programmatic use
   - `@api theme` — individual theme name for programmatic use
   - `@api locale` — e.g. `"fr"`, `"en-gb"`

2. **Resolution logic:** If `themeAndPalette` is set, parse it into theme and palette. Otherwise use `theme` + `themePalette`. Default to `classic/default` if nothing is provided.

3. **Lifecycle:** Initialize once in `renderedCallback` (guarded with an `_initialized` flag). Load in parallel:
   - `all.global.js` (core FullCalendar)
   - `skeleton.css` (base CSS)
   - `themes/<theme>/global.js` (theme plugin)
   - `themes/<theme>/theme.css` (theme styles)
   - `themes/<theme>/palettes/<palette>.css` (palette styles)
   - If locale is set: `locales/<locale>.global.js`

4. **After load:** Instantiate `new window.FullCalendar.Calendar(containerEl, mergedOptions)` where `mergedOptions` is the consumer's `options` plus callback wrappers that re-dispatch as LWC events. Get the container via `this.refs.container`.

5. **Event re-dispatch:** Wrap FullCalendar callbacks (`eventClick`, `dateClick`, `select`, `eventDrop`, `eventResize`, `eventChange`, `eventAdd`, `eventRemove`, at minimum) so they fire LWC `CustomEvent`s with lowercase names (`eventclick`, `dateclick`, etc.) and the callback arg as `event.detail`. Use `bubbles: false, composed: false` defaults.

6. **Options setter reactivity:** When `options` is reassigned after init, diff old vs new and for each changed key:
   - If `initialDate`: call `calendar.gotoDate(val)`
   - If `initialView`: call `calendar.changeView(val)`
   - If `events` or `eventSources`: `removeAllEventSources()` then `addEventSource(val)`
   - Otherwise: `calendar.setOption(key, val)`

7. **Theme/palette/locale change after init:** Warn to console that these are set-once; do not attempt hot-swap.

8. **Imperative API:** Expose `@api getCalendar()` returning the FullCalendar instance.

9. **Cleanup:** In `disconnectedCallback`, call `calendar.destroy()`.

10. **Static resource URL:** Import once via `@salesforce/resourceUrl/fullCalendarLib`.

Document assumptions inline as code comments where FullCalendar/LWC behavior is non-obvious (synthetic shadow, event retargeting, `this`-to-`window` binding).

## Phase 3: Write the build script

`scripts/build.ts` does the following steps:

1. **Resolve FullCalendar's dist location** via Node module resolution:
   ```ts
   import { createRequire } from 'node:module';
   import { dirname, join } from 'node:path';

   const require = createRequire(import.meta.url);
   const fcPkgPath = require.resolve('fullcalendar/package.json');
   const fcDist = join(dirname(fcPkgPath), 'dist');
   ```
   This works whether `fullcalendar` is a workspace symlink or an installed package.

2. **Enumerate themes and palettes** by scanning `fcDist/themes/`. For each theme directory:
   - Verify `global.js` and `theme.css` exist
   - If `palettes/` subdirectory exists, list its `.css` files
   - If `palette.css` (singular) exists instead, normalize: treat as theme with one palette named `default`

3. **Enumerate locales** by scanning `fcDist/locales/*.global.js`.

4. **Generate the `themeAndPalette` datasource string** as a comma-separated list of `<theme>/<palette>` values. Read `fullCalendar.js-meta.xml.template`, replace the placeholder, write the result to the output directory.

5. **Assemble the SFDX directory layout** into `dist/src-sfdx/force-app/main/default/`:
   ```
   lwc/fullCalendar/
     fullCalendar.html          ← copied from src/
     fullCalendar.js            ← copied from src/
     fullCalendar.js-meta.xml   ← processed from template
   staticresources/
     fullCalendarLib/
       all/global.js            ← from fullcalendar/dist/
       skeleton.css
       themes/
         <theme>/
           global.js
           theme.css
           palette.css          ← classic only; always loaded with the theme
           palettes/
             <palette>.css      ← selectable palettes for non-classic themes
       locales/
         <locale>/global.js
     fullCalendarLib.resource-meta.xml
   ```

6. **Generate `fullCalendarLib.resource-meta.xml`:**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
     <cacheControl>Private</cacheControl>
     <contentType>application/zip</contentType>
   </StaticResource>
   ```

7. **Create the release zip with the separate archive command** at `archives/fullcalendar-lwc-<version>.zip`, containing only the `force-app/main/default/...` tree. Version comes from the package's `package.json`.

The build script should be idempotent — safe to re-run, always rebuilding `dist` from scratch. The archive command consumes that built output.

## Phase 4: README

The README should cover:
- What this package is and what it's for
- Install instructions:
  1. Download the zip from GitHub Releases
  2. Copy `lwc/fullCalendar` and `staticresources/fullCalendarLib` + its meta file into the consumer's `force-app/main/default/`
  3. Deploy with `sf project deploy start`
- Usage examples:
  - Minimal: `<c-full-calendar options={calendarOptions}></c-full-calendar>`
  - With themes: `<c-full-calendar options={calendarOptions} theme="forma" theme-palette="blue" locale="en-gb"></c-full-calendar>`
  - Handling events: show `handleEventClick(e) { console.log(e.detail); }`
  - Reactivity gotcha: must reassign `options` (not mutate) to trigger updates
- App Builder usage: brief note on how the `themeAndPalette` + `locale` design attributes work
- Imperative API: document `getCalendar()` for power users
- Known limitations: theme/theme-palette are set-once after init, LWS constraints, etc.
- Link to FullCalendar's main docs for the options reference

## Phase 5: Example package for manual smoke-testing

Create sibling package `standard/packages/lwc-example/` with a minimal consumer LWC that embeds `<c-full-calendar>`. This keeps the smoke app in its own Salesforce project so the CLI only sees one project context.

```
standard/packages/lwc-example/
├── README.md               ← how to deploy to a scratch org to test
├── sfdx-project.json
└── force-app/main/default/
    ├── lwc/
    │   └── calendarDemo/
    │       ├── calendarDemo.html
    │       ├── calendarDemo.js
    │       └── calendarDemo.js-meta.xml
    └── applications/
        └── CalendarDemo.app-meta.xml
```

Manual test flow:
1. Run `pnpm build` in `standard/packages/lwc` to produce `dist/src-sfdx/`
2. The `lwc-example` package symlinks `force-app/main/default/lwc/fullCalendar` and `staticresources/fullCalendarLib*` into that built output
3. From `standard/packages/lwc-example`, run `pnpm run smoke:deploy`
4. Open the app and verify the calendar renders with a few sample events, theme, and palette

## Explicitly out of scope

- CI/CD or any automated deploy pipelines
- Unit tests (Jest) — manual testing via `standard/packages/lwc-example` only for v1 (`tests/` directory is reserved for future)
- Unlocked packaging / Dev Hub setup
- npm publication
- "Deploy to Salesforce" button or any one-click install
- TypeScript for the LWC component itself (component source stays JS)
- Reactive theme/palette/locale hot-swapping
- Custom property editor for App Builder
- Scratch org integration tests in CI
- Synthetic-shadow event bug preventive fixes (investigate if hit during manual testing; don't pre-solve)

## Open questions flagged for implementation

1. Confirm the static resource name — `fullCalendarLib` is the suggestion but match existing conventions if any exist elsewhere in the monorepo.
2. During manual testing, if the FullCalendar IIFE doesn't set `window.FullCalendar` under Lightning Web Security strict mode, adjust the vanilla package's IIFE footer rather than patch at copy time.
3. During manual testing, if event delegation or click handling fails (per the documented synthetic-shadow issues from existing wrappers in the wild), investigate root cause before patching.
