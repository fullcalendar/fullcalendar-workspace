
## Theme Pipeline

All themes start out as configuration files and tailwind classnames and are manually transformed through multiple phases. All phases are committed to the codebase. Below is the flow from file-to-file. The developer may make changes to upstream theme config/tailwind, and the explicitly ask to fill-in the downstream conversions.

### Default-UI Tailwind React Components

- Component housing: theming/ui-default-react-tailwind/src/theme-*/{event-calendar,scheduler}.tsx?
- Incorporates:
  - theming/theme-*-tailwind/src/options-{event-calendar,scheduler,slots}.tsx?
  - theming/theme-*-tailwind/src/ui-default-options-{event-calendar,scheduler}.tsx?
- Compiles to:
  - theming/ui-default-react-tailwind/src/theme-*/_compiled/{event-calendar,scheduler}(-simple)?.tsx?

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

The vanilla file (`ui-default-palettes-vanilla.css`) mirrors this same structure with resolved color values.

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

**Critical:** For MUI, the `theme.css` files are also manual compiled artifacts. When propagating changes into the final `theming/ui-mui/src/*` outputs, you must add CSS definitions for any newly introduced Tailwind classnames and remove definitions for classnames that are no longer used anywhere in the corresponding final `.tsx` files.
