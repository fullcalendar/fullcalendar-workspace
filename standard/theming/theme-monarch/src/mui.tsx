import { createThemePlugin } from './base.js'

/*
Ensure all these css variables are injected into DOM when cssVariables is false
*/

/*
TODO: use shadows and border-radius somehow!!! They're in the theme object
*/

const themePlugin = createThemePlugin({
  // TODO: better hasNavLink
  todayPillClass: () => 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)',
  pillClass: () => 'bg-(--mui-palette-secondary-light) dark:bg-(--mui-palette-secondary-dark) text-(--mui-palette-secondary-contrastText)',

  highlightClass: 'bg-(--mui-palette-secondary-main) opacity-10',
  disabledBgClass: 'bg-(--mui-palette-action-disabledBackground)',

  borderColorClass: 'border-(--mui-palette-divider)',
  majorBorderColorClass: 'border-(--mui-palette-primary-main)', // will have color. might be cool
  alertBorderColorClass: 'border-(--mui-palette-error-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-15',
  backgroundEventContrastColor: '', // don't need contrast bc so opaque
})

export { themePlugin as default }
