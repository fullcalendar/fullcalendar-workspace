import { createThemePlugin } from './base.js'

const primarySurfaceClass = 'bg-(--mui-palette-primary-main) text-(--mui-palette-primary-contrastText)'
const secondarySurfaceClass = 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)'

const themePlugin = createThemePlugin({
  primarySurfaceClass,
  secondarySurfaceClass,
  primaryPressableClass: `${primarySurfaceClass} hover:bg-(--mui-palette-primary-dark) active:bg-(--mui-palette-primary-light)`,
  secondaryPressableClass: `${secondarySurfaceClass} hover:bg-[#d6d4f0] active:bg-[#c4c1e9]`, // ???
  disabledTextColorClass: 'text-gray-500',
  borderColorClass: 'border-[#dde3ea] dark:border-gray-800', // ???
  majorBorderColorClass: 'border-gray-400 dark:border-gray-700',
  alertBorderColorClass: 'border-(--mui-palette-error-main)',
})

export { themePlugin as default }
