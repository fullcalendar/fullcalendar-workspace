import { createThemePlugin } from './base.js'

const primaryClass = 'bg-primary text-primary-foreground'
const primaryButtonClass = `${primaryClass} hover:bg-primary/90 active:bg-primary/80`

const secondaryClass = 'bg-secondary text-secondary-foreground'
const secondaryButtonClass = `${secondaryClass} hover:bg-secondary/90 active:bg-secondary/80`

const tertiaryClass = 'bg-accent bg-accent-foreground'
const tertiaryButtonClass = `${tertiaryClass} hover:bg-accent/90 active:bg-accent/80`

const themePlugin = createThemePlugin({
  primaryButtonClass,
  primaryContainerClass: primaryClass,
  primaryContainerButtonClass: primaryButtonClass,

  secondaryButtonClass,
  secondaryContainerClass: secondaryClass,

  tertiaryClass,
  tertiaryButtonClass,

  highlightClass: 'bg-primary opacity-10',

  borderColorClass: '', // border-color is set globally
  majorBorderColorClass: 'border-ring', // if atomic var ... majorBorderColor: 'var(--ring)'
  alertBorderColorClass: 'border-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--secondary)',
  backgroundEventContrastColor: 'var(--secondary-foreground)',
})

export { themePlugin as default }
