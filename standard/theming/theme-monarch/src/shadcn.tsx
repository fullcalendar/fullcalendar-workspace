import { createThemePlugin } from './base.js'

const primaryClass = 'bg-primary text-primary-foreground'
const primaryButtonClass = `${primaryClass} hover:bg-primary/90 active:bg-primary/80`

const secondaryClass = 'bg-secondary text-secondary-foreground'
const secondaryButtonClass = `${secondaryClass} hover:bg-secondary/90 active:bg-secondary/80`

const tertiaryClass = 'bg-accent bg-accent-foreground'
const tertiaryButtonClass = `${tertiaryClass} hover:bg-accent/90 active:bg-accent/80`

const themePlugin = createThemePlugin({
  primaryClass,
  primaryButtonClass,
  primaryContainerClass: primaryClass,
  primaryContainerButtonClass: primaryButtonClass,

  secondaryClass,
  secondaryButtonClass,
  secondaryContainerClass: secondaryClass,
  secondaryContainerButtonClass: secondaryButtonClass,

  tertiaryClass,
  tertiaryButtonClass,
  tertiaryContainerClass: tertiaryClass,
  tertiaryContainerButtonClass: tertiaryButtonClass,

  disabledButtonClass: 'bg-muted text-muted-foreground', // TODO: do 50% opacity?
  highlightClass: 'bg-primary opacity-50',

  borderColorClass: '', // border-color is set globally
  majorBorderColorClass: 'border-ring',
  alertBorderColorClass: 'border-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--secondary)',
  backgroundEventContrastColor: 'var(--secondary-foreground)',
})

export { themePlugin as default }
