import { createThemePlugin } from './base.js'

/*
Ensure all these css variables are injected into DOM when cssVariables is false
*/

const primaryClass = 'bg-(--mui-palette-primary-main) text-(--mui-palette-primary-contrastText)'
const primaryButtonClass = `${primaryClass} hover:bg-(--mui-palette-primary-dark) active:bg-(--mui-palette-primary-light)`

const secondaryClass = 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)'
const secondaryButtonClass = `${secondaryClass} hover:bg-(--mui-palette-secondary-dark) active:bg-(--mui-palette-secondary-light)`

const tertiaryClass = 'bg-(--mui-palette-success-main) text-(--mui-palette-success-contrastText)'
const tertiaryButtonClass = `${tertiaryClass} hover:bg-(--mui-palette-success-dark) active:bg-(--mui-palette-success-light)`

const themePlugin = createThemePlugin({
  primaryButtonClass,
  primaryContainerClass: secondaryClass, // HACK
  primaryContainerButtonClass: secondaryButtonClass, // HACK

  secondaryButtonClass,
  secondaryContainerClass: secondaryClass,

  tertiaryClass,
  tertiaryButtonClass,

  highlightClass: 'bg-(--mui-palette-secondary-main) opacity-10',

  borderColorClass: 'border-(--mui-palette-divider)',
  majorBorderColorClass: 'border-(--mui-palette-primary-main)', // will have color. might be cool
  alertBorderColorClass: 'border-(--mui-palette-error-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventContrastColor: 'var(--mui-palette-secondary-contrastText)',
})

export { themePlugin as default }
