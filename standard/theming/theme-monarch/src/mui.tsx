import { createThemePlugin } from './base.js'

const primarySurfaceClass = 'bg-(--mui-palette-primary-main) text-(--mui-palette-primary-contrastText)'
const secondarySurfaceClass = 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)'

const themePlugin = createThemePlugin({
  primarySurfaceClass,
  secondarySurfaceClass,

  primaryPressableClass: `${primarySurfaceClass} hover:bg-(--mui-palette-primary-dark) active:bg-(--mui-palette-primary-light)`,
  secondaryPressableClass: `${secondarySurfaceClass} hover:bg-(--mui-palette-secondary-dark) active:bg-(--mui-palette-secondary-light)`,

  disabledTextColorClass: 'text-gray-500',
  borderColorClass: 'border-[#dde3ea] dark:border-gray-800', // ???
  majorBorderColorClass: 'border-gray-400 dark:border-gray-700',
  alertBorderColorClass: 'border-(--mui-palette-error-main)',

  // TODO
  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventContrastColor: 'var(--mui-palette-secondary-contrastText)',
})

export { themePlugin as default }
