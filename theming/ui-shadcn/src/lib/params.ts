import { ThemeOptionParams } from '@fullcalendar/theme-common'

// TODO: use transition, like Shadn
// However, when we do transition-all like the buttons have,
// drag & drop gets really distorted. How to blacklist position? Or whitelist what we want?
const focusConfigClass = 'ring-ring/50 outline-none'
const focusOutlineClass = `focus-visible:ring-3 ${focusConfigClass}`
const focusOutlineGroupClass = `group-focus-visible:ring-3 ${focusConfigClass}`
const selectedOutlineClass = 'ring-3 ring-ring/50'

const primaryClass = 'bg-(--primary) text-(--primary-foreground)'
const primaryPressableClass = primaryClass // TODO: effect!

const secondaryClass = 'bg-foreground/10'
const secondaryPressableClass = `${secondaryClass} hover:bg-foreground/20 ${focusOutlineClass}`

// tertiary (based on primary, but with low contrast)
const tertiaryClass = 'bg-primary/20 dark:bg-primary/30' // ALSO SORTA LIKE neutralClass
const tertiaryPressableClass = `${tertiaryClass} hover:bg-primary/40 ${focusOutlineClass}`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-primary/40 ${focusOutlineGroupClass}`

const ghostHoverClass = 'hover:bg-foreground/5'
const ghostHoverGroupClass = 'group-hover:bg-foreground/5'
const ghostPressableClass = `${ghostHoverClass} ${focusOutlineClass}`
const ghostPressableGroupClass = `${ghostHoverGroupClass} ${focusOutlineGroupClass}`

const faintHoverClass = 'hover:bg-muted/50'
const faintPressableClass = `${faintHoverClass} focus-visible:bg-muted/50`

export const optionParams: ThemeOptionParams = {
  primaryClass,
  primaryPressableClass,

  secondaryClass,
  secondaryPressableClass,

  tertiaryClass,
  tertiaryPressableClass,
  tertiaryPressableGroupClass,

  ghostHoverClass,
  ghostPressableClass,
  ghostPressableGroupClass,

  // TODO
  strongClass: 'bg-foreground/15',
  strongPressableClass: 'bg-foreground/15',

  // TODO
  mutedClass: 'bg-foreground/5',
  mutedPressableClass: 'bg-foreground/5',

  faintHoverClass,
  faintPressableClass,

  focusOutlineClass,
  focusOutlineGroupClass,
  selectedOutlineClass,

  strongBgClass: 'bg-foreground/15',
  mutedBgClass: 'bg-foreground/5', // semi-transparent version of bg-muted
  faintBgClass: 'bg-foreground/3', // semi-transparent version of bg-sidebar
  highlightClass: 'bg-primary opacity-10', // TODO: use /10 instead of opacity on element?
  todayBgNotPrintClass: 'not-print:bg-yellow-400/15 dark:bg-yellow-200/10',

  // most borders are inherited
  borderColorClass: '',
  borderStartColorClass: '',
  primaryBorderColorClass: 'border-primary',
  strongBorderColorClass: 'border-foreground/20',
  strongBorderBottomColorClass: 'border-b-foreground/20',
  mutedBorderColorClass: '', // same as normal
  nowBorderColorClass: 'border-destructive',
  nowBorderStartColorClass: 'border-s-destructive',
  nowBorderTopColorClass: 'border-t-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  bgEventColor: 'var(--primary)',
  bgEventColorClass: 'opacity-15',

  popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',
  // (breezy) popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',
  // (classic) popoverClass: 'border bg-background text-foreground shadow-lg',
  // (forma) popoverClass: 'border bg-background text-foreground shadow-md',
  // (monarch) popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',
  // (pulse) popoverClass: 'border bg-background text-foreground shadow-lg rounded-md shadow-md m-1',

  bgClass: 'bg-background',
  bgOutlineColorClass: 'outline-background',

  fgClass: '',
  strongFgClass: '',
  mutedFgClass: 'text-muted-foreground',
  faintFgClass: 'text-muted-foreground',
}
