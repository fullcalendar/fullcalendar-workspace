
## Theme Pipeline

All themes start out as configuration files and tailwind classnames and are manually transformed through multiple phases. All phases are committed to the codebase. When making changes to upstream theme config/tailwind, ensure all downstream phase files are modified as well.

### Default-UI JS Plugin

- Plugin housing: theming/theme-*-tailwind/src/index.tsx?
- Incorporates:
  - theming/theme-*-tailwind/src/options-{event-calendar,scheduler,slots}.tsx?
  - theming/theme-*-tailwind/src/ui-default-options-{event-calendar,scheduler}.tsx?
- Compiles to:
  - standard/packages/preact/src/themes/*/index.tsx?
  - standard/packages/preact/src/themes/*/theme.css (CSS definitions for tailwind classnames)

### Default-UI Tailwind React Components

- Component housing: theming/ui-default-react-tailwind/src/theme-*/{event-calendar,scheduler}.tsx?
- Incorporates:
  - theming/theme-*-tailwind/src/options-{event-calendar,scheduler,slots}.tsx?
  - theming/theme-*-tailwind/src/ui-default-options-{event-calendar,scheduler}.tsx?
- Compiles to:
  - theming/ui-default-react-tailwind/src/theme-*/_compiled/{event-calendar,scheduler}(-simple)?.tsx?

### Default-UI Color Palettes

- Start: theming/theme-*-tailwind/src/ui-default-palettes.css
- Transformed to: theming/theme-*-tailwind/src/ui-default-palettes-vanilla.css
- Split to either:
  - standard/packages/preact/src/themes/*/palettes/*.css (for most themes)
  - standard/packages/preact/src/themes/classic/palette.css (for classic theme only)

### Shadcn Components

- Component housing: theming/ui-shadcn/src/theme-*/{event-calendar,scheduler}.tsx?
- Incorporates:
  - theming/theme-*-tailwind/src/options-{event-calendar,scheduler,slots}.tsx?
  - theming/ui-shadcn/src/lib/option-params.ts (theme-agnostic)
- Compiles to:
  - theming/ui-shadcn/src/theme-*/_compiled/{event-calendar,scheduler}-views.tsx?

### MUI Components

- Component housing: theming/ui-mui-tailwind/src/theme-*/{EventCalendar,Scheduler}View.tsx?
- Incorporates:
  - theming/theme-*-tailwind/src/options-{event-calendar,scheduler,slots}.tsx?
  - theming/ui-mui-tailwind/src/lib/option-params.ts (theme-agnostic)
- Compiles to:
  - theming/ui-mui-tailwind/src/theme-*/_compiled/{EventCalendar,Scheduler}View.tsx?
- Further compiles to:
  - theming/ui-mui/src/*/{EventCalendar,Scheduler}View.tsx?
  - theming/ui-mui/src/*/theme.css (CSS definitions for tailwind classnames)
