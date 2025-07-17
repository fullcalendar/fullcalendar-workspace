import { createThemePlugin } from './base.js'

const buttonEffectClass = 'hover:brightness-80 active:brightness-120'
const primaryButtonClass = `bg-(--fc-monarch-primary) text-(--fc-monarch-on-primary) ${buttonEffectClass}`
const secondaryButtonClass = `bg-(--fc-monarch-secondary) text-(--fc-monarch-on-secondary) ${buttonEffectClass}`

const themePlugin = createThemePlugin({
  toolbar: {
    primaryButtonClass: (data) => primaryButtonClass + (data.isDisabled ? ' opacity-90' : ''),
    secondaryButtonClass: (data) => secondaryButtonClass + (data.isDisabled ? ' opacity-90' : ''),
  },

  todayPillClass: (data) => 'bg-(--fc-monarch-tertiary) text-(--fc-monarch-on-tertiary)' + (data.hasNavLink ? ' ' + buttonEffectClass : ''),
  pillClass: (data) => 'bg-(--fc-monarch-primary-container) text-(--fc-monarch-on-primary-container)' + (data.hasNavLink ? ' ' + buttonEffectClass : ''),

  highlightClass: 'bg-(--fc-monarch-primary-container) opacity-30',
  disabledBgClass: 'bg-gray-500/7', // TODO: better theme value

  borderColorClass: 'border-(--fc-monarch-outline-variant)',
  majorBorderColorClass: 'border-(--fc-monarch-outline)',
  alertBorderColorClass: 'border-(--fc-monarch-error)',

  /*
  canvasBgColorClass
  canvasOutlineColorClass
  ---
  eventually just...
  canvasBgColor
  canvasOutlineColor
  */

  // give default icons

  /*
  resourceExpanderContent ... is a scoped slot, like dayHeaderContent!!!
    Q: how will work with Vue frameworks?
    A: we use a Vue-specific icon, and outputs as JSX. our React/Vue/Angular connectors can handle it now anyway
  popoverCloseContent

  popoverClass
  */

  eventColor: 'var(--fc-monarch-primary)',
  eventContrastColor: 'var(--fc-monarch-on-primary)',
  backgroundEventColor: 'var(--fc-monarch-tertiary)',
  backgroundEventColorClass: 'brightness-115 opacity-15',
})

export { themePlugin as default }
