import { createThemePlugin } from './base.js'

const primarySurfaceClass = 'bg-(--fc-monarch-primary) text-(--fc-monarch-on-primary)'
const secondarySurfaceClass = 'bg-(--fc-monarch-secondary) text-(--fc-monarch-on-secondary)'

const themePlugin = createThemePlugin({
  primarySurfaceClass,
  secondarySurfaceClass,

  primaryPressableClass: `${primarySurfaceClass}`, // TODO: active/hover
  secondaryPressableClass: `${secondarySurfaceClass}`, // TODO: active/hover

  disabledTextColorClass: 'text-gray-500',
  borderColorClass: 'border-(--fc-monarch-outline-variant)',
  majorBorderColorClass: 'border-(--fc-monarch-outline)',
  alertBorderColorClass: 'border-(--fc-monarch-error)',

  eventColor: 'var(--fc-monarch-tertiary)',
  eventContrastColor: 'var(--fc-monarch-on-tertiary)',
  backgroundEventColor: 'var(--fc-monarch-tertiary-container)',
  backgroundEventContrastColor: 'var(--fc-monarch-on-tertiary-container)',
})

export { themePlugin as default }
