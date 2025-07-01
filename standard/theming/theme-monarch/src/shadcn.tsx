import { createThemePlugin } from './base.js'

/*
MODs to this ShadCN theme:
- removed border b/c shadcn sets globally

TODO:
- dark-mode audit

BUGS:
- now that we don't use toolbar, navlinks to day view go to useless dayGridDay instead of timeGridWeek
- non-business background color conflicts with the week number pills

NOTES:
- when color not needed, `borderClass` variable is dumb. can just use 'border'

CSS var usage:
  when we need transparency:
  - more-link hover
  - daygrid-list-even hover + selection states
  - week-number floating over cell
  - day-number floating over cell
  when solid allowed:
  - business hours (because bg-events and selection put above)
  SO...
    use --accent for business hours (what shadcn datepicker does)
    use --primary for selection (but with our opacity applied)
    use --destructive for now-indicator
    use --border for borders obviously
    use --ring for emphasized isMajor borders
    use --accent on hover for certain buttons (because shadcn ghost-style button uses it)
      for X button in popover
      for row-expander icon in resource-timeline
      (basically anything buttonlike that does NOT need transaprent bg)
    use custom grays for everything else
    maybe use --muted for disable days (along with muted text)
*/

const primarySurfaceClass = 'bg-primary text-primary-foreground'
const secondarySurfaceClass = 'bg-secondary text-secondary-foreground'

const themePlugin = createThemePlugin({
  primarySurfaceClass,
  secondarySurfaceClass,

  primaryPressableClass: `${primarySurfaceClass} hover:bg-primary/90 active:bg-primary/80`,
  secondaryPressableClass: `${secondarySurfaceClass} hover:bg-secondary/90 active:bg-secondary/80`,

  disabledTextColorClass: 'text-muted-foreground',
  borderColorClass: '', // border-color is set globally
  majorBorderColorClass: 'border-gray-400 dark:border-gray-700',
  alertBorderColorClass: 'border-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--secondary)',
  backgroundEventContrastColor: 'var(--secondary-foreground)',
})

export { themePlugin as default }
