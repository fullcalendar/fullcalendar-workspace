import { joinClassNames } from '@fullcalendar/core'
import { ThemeOptionParams } from '@fullcalendar/theme-common'

const outlineWidthClass = 'outline-3'
const outlineWidthFocusClass = 'focus-visible:outline-3'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'
const outlineInsetClass = '-outline-offset-3'

// single outline style
const outlineColorClass = 'outline-ring/50'
const outlineFocusClass = `${outlineColorClass} ${outlineWidthFocusClass}`

const primaryClass = 'bg-primary text-(--primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-primary/90`
const primaryPressableGroupClass = `${primaryClass} group-hover:bg-primary/90`

const secondaryClass = 'bg-foreground/10'
const secondaryPressableClass = `${secondaryClass} hover:bg-foreground/20 ${outlineFocusClass}`

// tertiary (based on primary, but with low contrast)
const tertiaryClass = 'bg-primary/20 dark:bg-primary/30' // ALSO SORTA LIKE neutralClass
const tertiaryPressableClass = `${tertiaryClass} hover:bg-primary/40 ${outlineFocusClass}`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-primary/40`

const ghostHoverClass = 'hover:bg-foreground/5'
const ghostHoverGroupClass = 'group-hover:bg-foreground/5'
const ghostPressableClass = `${ghostHoverClass} ${outlineFocusClass}`
const ghostPressableGroupClass = `${ghostHoverGroupClass}`

const faintHoverClass = 'hover:bg-muted/50'
const faintPressableClass = `${faintHoverClass} focus-visible:bg-muted/50`

const mutedClass = 'bg-foreground/5'
const mutedPressableClass = `${mutedClass} hover:bg-foreground/10`

// very probable, tho not guaranteed, this will be solid
// however, --foreground and --background almost always solid
// for a bulletproof technique, use the linear-gradient technique, but extremely verbose with nested expressions
const strongSolidClass = 'bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))]'
const strongSolidPressableClass = `${strongSolidClass} hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))]`

const faintEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--background))]'
const faintEventPressableClass = joinClassNames(
  faintEventBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--background))]',
)

const mutedEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--background))]'
const mutedEventPressableClass = joinClassNames(
  mutedEventBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_35%,var(--background))]',
)

const mutedEventFgClass = 'text-[color-mix(in_oklab,var(--fc-event-color)_50%,var(--foreground))]'

const bgEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]'

export const optionParams: ThemeOptionParams = {
  primaryClass,
  primaryPressableClass,
  primaryPressableGroupClass,

  secondaryClass,
  secondaryPressableClass,

  tertiaryClass,
  tertiaryPressableClass,
  tertiaryPressableGroupClass,

  ghostHoverClass,
  ghostPressableClass,
  ghostPressableGroupClass,

  strongSolidPressableClass,

  mutedClass,
  mutedPressableClass,

  faintHoverClass,
  faintPressableClass,

  primaryOutlineColorClass: outlineColorClass,
  tertiaryOutlineColorClass: outlineColorClass,
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineWidthGroupFocusClass,
  outlineOffsetClass: '',
  outlineInsetClass,

  mutedBgClass: 'bg-foreground/5', // semi-transparent version of bg-muted
  mutedSolidBgClass: 'bg-muted',
  faintBgClass: 'bg-foreground/3', // semi-transparent version of bg-sidebar
  highlightClass: 'bg-primary/10',
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
  bgEventColor: 'var(--foreground)',
  bgEventBgClass,

  popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',
  // (breezy) popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',
  // (classic) popoverClass: 'border bg-background text-foreground shadow-lg',
  // (forma) popoverClass: 'border bg-background text-foreground shadow-md',
  // (monarch) popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',
  // (pulse) popoverClass: 'border bg-background text-foreground shadow-lg rounded-md shadow-md m-1',

  bgClass: 'bg-background',
  bgRingColorClass: 'ring-background',

  fgClass: '',
  strongFgClass: '',
  mutedFgClass: 'text-muted-foreground',
  faintFgClass: 'text-muted-foreground',

  faintEventBgClass,
  faintEventPressableClass,
  mutedEventBgClass,
  mutedEventPressableClass,
  mutedEventFgClass,
}
