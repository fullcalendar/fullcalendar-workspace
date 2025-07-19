import { createThemePlugin } from './base.js'

/*
Try making EVENTS semitransparent, and make today-circle opaque?
*/

// rename
const primaryClass = 'bg-primary/20 dark:bg-primary/30' // doesn't need text contrast
const primaryButtonClass = `${primaryClass} hover:bg-primary/90 active:bg-primary/80`

// better than "accent" because sits well on top of nonBusinessHours gray
const accentClass = 'bg-black/10 dark:bg-white/10 text-accent-foreground'
const accentButtonClass = `${accentClass} hover:bg-gray-500/20 active:bg-gray-500/30` // TODO: better dary mode

const themePlugin = createThemePlugin({
  todayPillClass: (data) => data.hasNavLink ? primaryButtonClass : primaryClass,
  pillClass: (data) => data.hasNavLink ? accentButtonClass : accentClass,

  highlightClass: 'bg-primary opacity-10',
  disabledBgClass: 'bg-muted',

  borderColorClass: '', // border-color is set globally
  majorBorderColorClass: 'border-ring', // if atomic var ... majorBorderColor: 'var(--ring)'
  alertBorderColorClass: 'border-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',
})

export { themePlugin as default }
