import { createThemePlugin } from './base.js'

const buttonEffectClass = 'hover:brightness-80 active:brightness-120'

const primaryClass = 'bg-(--fc-monarch-primary) text-(--fc-monarch-on-primary)'
const primaryButtonClass = `${primaryClass} ${buttonEffectClass}`
const primaryContainerClass = 'bg-(--fc-monarch-primary-container) text-(--fc-monarch-on-primary-container)'
const primaryContainerButtonClass = `${primaryContainerClass}`

const secondaryClass = 'bg-(--fc-monarch-secondary) text-(--fc-monarch-on-secondary)'
const secondaryButtonClass = `${secondaryClass} ${buttonEffectClass}`
const secondaryContainerClass = 'bg-(--fc-monarch-secondary-container) text-(--fc-monarch-on-secondary-container)'

const tertiaryClass = 'bg-(--fc-monarch-tertiary) text-(--fc-monarch-on-tertiary)'
const tertiaryButtonClass = `${tertiaryClass} ${buttonEffectClass}`

const themePlugin = createThemePlugin({
  primaryButtonClass,
  primaryContainerClass,
  primaryContainerButtonClass,

  secondaryButtonClass,
  secondaryContainerClass,

  tertiaryClass,
  tertiaryButtonClass,

  highlightClass: 'bg-(--fc-monarch-primary-container) opacity-30',

  borderColorClass: 'border-(--fc-monarch-outline-variant)',
  majorBorderColorClass: 'border-(--fc-monarch-outline)',
  alertBorderColorClass: 'border-(--fc-monarch-error)',

  eventColor: 'var(--fc-monarch-primary)',
  eventContrastColor: 'var(--fc-monarch-on-primary)',
  backgroundEventColor: 'var(--fc-monarch-tertiary-container)',
  backgroundEventContrastColor: 'var(--fc-monarch-on-tertiary-container)',
})

export { themePlugin as default }
