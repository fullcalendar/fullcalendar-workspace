
## Theme Pipeline

All themes start out as configuration files and tailwind classnames and are manually transformed through multiple phases. All phases are committed to the codebase. Below is the flow from file-to-file. The developer may make changes to upstream theme config/tailwind, and the explicitly ask to fill-in the downstream conversions.

### Default-UI Tailwind React Components

- Component housing: theming/ui-default-react-tailwind/src/theme-*/{event-calendar,scheduler}.tsx?
- Incorporates:
  - theming/theme-*-tailwind/src/options-{event-calendar,scheduler,slots}.tsx?
  - theming/theme-*-tailwind/src/ui-default-options-{event-calendar,scheduler}.tsx?
- Compiles to:
  - theming/ui-default-react-tailwind/src/theme-*/_compiled/{event-calendar,scheduler}(-simple)?.tsx?

The `-simple` compiled files are copy-paste fork templates for end-users. All three reset classnames (see [Reset Classnames](#reset-classnames-root-reset--button-reset--link-reset) below) are obligatory in every `-simple` file. **Stripping for Tailwind users:** the demo generator strips all three from generated code when the user picks Tailwind (`needsThemeCss === false`) via regex in `theming/demo-react/src/lib/demo-generator-code.ts`.

### Default-UI JS Plugin

- Plugin housing: theming/theme-*-tailwind/src/index.tsx?
- Incorporates:
  - theming/theme-*-tailwind/src/options-{event-calendar,scheduler,slots}.tsx?
  - theming/theme-*-tailwind/src/ui-default-options-{event-calendar,scheduler}.tsx?
- Compiles to:
  - standard/packages/preact/src/themes/*/index.tsx?
  - standard/packages/preact/src/themes/*/theme.css (CSS definitions for tailwind classnames)

**Critical:** `theme.css` is a manually compiled CSS file — there is no build step. When propagating changes to `index.tsx`, you must also manually update `theme.css` to add definitions for any newly introduced Tailwind classnames and remove definitions for any classnames that are no longer used anywhere in the file. Each classname maps directly to its CSS equivalent (e.g. `rounded-t-xl` → `border-top-left-radius: 12px; border-top-right-radius: 12px`). Check the existing entries in `theme.css` for the naming/formatting pattern.

### Default-UI Color Palettes

- Start: theming/theme-*-tailwind/src/ui-default-palettes.css
- Transformed to: theming/theme-*-tailwind/src/ui-default-palettes-vanilla.css
- Split to either:
  - standard/packages/preact/src/themes/*/palettes/*.css (for most themes)
  - standard/packages/preact/src/themes/classic/palette.css (for classic theme only)

#### Palette CSS structure mapping

The source file (`ui-default-palettes.css`) uses Tailwind color references and is structured as:
- `:root` — global light-mode defaults (palette-agnostic)
- `[data-color-scheme=dark]` — global dark-mode overrides (palette-agnostic)
- `[data-palette=X]` — palette-specific light/default values
- `[data-palette=X][data-color-scheme=dark]` — palette-specific dark overrides

The vanilla file (`ui-default-palettes-vanilla.css`) mirrors this same structure with resolved color values. When propagating changes from the source to the vanilla file, apply these transforms:

1. **Resolve Tailwind color vars**: Replace every `var(--color-X)` with its hex equivalent using the lookup table in `theming/skills/tailwind-color-convert.md`.

2. **Flatten `color-mix(..., transparent)` to hex+alpha**: When a `color-mix(in oklab, <color> X%, transparent)` references a statically-known color (a direct hex, `rgb()`, or a Tailwind var that was just resolved), convert it to a hex color with an alpha channel byte appended. The alpha byte = `round(X / 100 × 255)` formatted as 2 uppercase hex digits (e.g. `color-mix(in oklab, var(--color-mauve-500) 10%, transparent)` → `#79697b` + alpha for 10% = `1A` → `#79697b1A`). This avoids relying on `color-mix` for browser compatibility. If a `color-mix` argument is a local CSS custom property (e.g. `var(--fc-monarch-secondary)`), look up its literal value from the same selector block and substitute it before applying the conversion — local palette vars defined in the same block are always statically known.

3. **Flatten `color-mix(..., white)` to hex**: When a `color-mix(in oklab, <color> X%, white)` references a statically-known color (direct hex, `rgb()`, or any local palette var defined in the same block), compute the result by interpolating in OKLab color space and write the resulting `rgb()` or hex value. If a `color-mix` argument is a local CSS custom property, substitute its literal value from the same block first. Only leave `color-mix` intact when one of its arguments is itself a CSS custom property whose value is not defined in the same block (e.g. dynamic vars that cascade from an outer context).

The split per-palette files (`palettes/X.css`) each contain only one palette's variables, restructured as:
- `:root` — combines global light defaults + palette-specific light values
- `[data-color-scheme=dark]` — combines global dark overrides + palette-specific dark overrides

**Critical:** When propagating changes, preserve the light/dark context. A variable defined in `[data-palette=X]` (light) in the source belongs in `:root` in the split file — **not** in `[data-color-scheme=dark]`. A variable in `[data-palette=X][data-color-scheme=dark]` (dark) belongs in `[data-color-scheme=dark]` in the split file.

### Shadcn Components

- Component housing:
  - theming/ui-shadcn/src/theme-*/{event-calendar,scheduler}.tsx?
- Incorporates:
  - theming/theme-*-tailwind/src/options-{event-calendar,scheduler}.ts
  - theming/theme-*-tailwind/src/slots.tsx? (themes that have slot overrides)
  - theming/ui-shadcn/src/lib/option-params.ts (theme-agnostic)
- Compiles to:
  - theming/ui-shadcn/src/theme-*/_compiled/{event-calendar-toolbar,event-calendar-icons,event-calendar-views,event-calendar}.tsx?
  - theming/ui-shadcn/src/theme-*/_compiled/{scheduler-views,resource-timegrid,resource-timeline}.tsx?

**Critical:** The AGENTS-listed `*-views.tsx` files are not the whole Shadcn output surface. Wrapper-level DOM, toolbar DOM, and icon/close-button DOM also land in additional `_compiled/*.tsx` files and must be audited when checking end-to-end DOM equivalence.

### MUI Components

- Component housing:
  - theming/ui-mui-tailwind/src/theme-*/{EventCalendar,Scheduler}.tsx?
  - theming/ui-mui-tailwind/src/theme-*/{EventCalendarViews,SchedulerViews}.tsx?
- Incorporates:
  - theming/theme-*-tailwind/src/options-{event-calendar,scheduler}.ts
  - theming/theme-*-tailwind/src/slots.tsx? (themes that have slot overrides)
  - theming/ui-mui-tailwind/src/lib/option-params.ts (theme-agnostic)
- Compiles to:
  - theming/ui-mui-tailwind/src/theme-*/_compiled/{EventCalendar,EventCalendarToolbar,EventCalendarViews,Scheduler,SchedulerViews}.tsx?
- Further compiles to:
  - theming/ui-mui/src/*/{EventCalendarViews,SchedulerViews}.tsx?
  - theming/ui-mui/src/*/theme.css (CSS definitions for tailwind classnames)

**Critical:** For MUI, the `theme.css` files are also manual compiled artifacts. When propagating changes into the final `theming/ui-mui/src/*` outputs, you must add CSS definitions for any newly introduced Tailwind classnames and remove definitions for classnames that are no longer used anywhere in the corresponding final `.tsx` files. All three reset classnames (see [Reset Classnames](#reset-classnames-root-reset--button-reset--link-reset) below) are required in these output files.

### Reset Classnames: `root-reset` / `button-reset` / `link-reset`

These three classnames are CSS resets defined in each theme's `theme.css` and used in the JS plugin output, the Default-UI `-simple` fork templates, and the MUI output files.

Canonical placements per theme:
- `root-reset` — on the root container `className` prop and on `popoverClass`
- `button-reset` — on toolbar button class variables and on `popoverCloseClass`
- `link-reset` — on `eventClass`, conditionally: `data.event.url && 'link-reset'` (alongside `data.isDragging && 'root-reset'` at the top of the callback)
