import { createThemePlugin } from './base.js'

const primarySurfaceClass = 'bg-(--fc-theme-primary) text-(--fc-theme-primary-text)'
const secondarySurfaceClass = 'bg-(--fc-theme-secondary) text-(--fc-theme-secondary-text)'

const themePlugin = createThemePlugin({
  primarySurfaceClass,
  secondarySurfaceClass,
  primaryPressableClass: `${primarySurfaceClass} hover:bg-(--fc-theme-primary-hover) active:bg-(--fc-theme-primary-pressed)`,
  secondaryPressableClass: `${secondarySurfaceClass} hover:bg-(--fc-theme-secondary-hover) active:bg-(--fc-theme-secondary-pressed)`,
  disabledTextColorClass: 'text-gray-500',
  borderColorClass: 'border-[#dde3ea] dark:border-gray-800',
  majorBorderColorClass: 'border-gray-400 dark:border-gray-700',
  alertBorderColorClass: 'border-red-600 dark:border-red-400',
})

export { themePlugin as default }
