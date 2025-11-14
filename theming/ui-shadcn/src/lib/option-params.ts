import { joinClassNames } from '@fullcalendar/core'
import { ThemeOptionParams } from '@fullcalendar/theme-common'

// outline
const outlineWidthClass = 'outline-3'
const outlineWidthFocusClass = 'focus-visible:outline-3'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'
const outlineInsetClass = '-outline-offset-3'
const outlineColorClass = 'outline-ring/50'
const outlineFocusClass = `${outlineColorClass} ${outlineWidthFocusClass}`

// stronger (13%)
const strongerSolidBgHoverClass = 'hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))]'

// strong (10%)
const strongBgClass = 'bg-foreground/10'
const strongBgHoverClass = 'hover:bg-foreground/10'
const strongSolidBgClass = 'bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))]'
const strongSolidPressableClass = `${strongSolidBgClass} ${strongerSolidBgHoverClass}`

// muted (5% - simulates a semi-transparent version of bg-muted)
const mutedBgClass = 'bg-foreground/5'
const mutedBgHoverClass = 'hover:bg-foreground/5'
const mutedBgHoverGroupClass = 'group-hover:bg-foreground/5'

// faint (50% of bg-muted)
const faintBgHoverClass = 'hover:bg-muted/50'
const faintBgFocusClass = 'focus-visible:bg-muted/50'

// primary
const primaryClass = 'bg-primary text-(--primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-primary/90`
const primaryPressableGroupClass = `${primaryClass} group-hover:bg-primary/90`

// secondary (neutral)
const secondaryClass = strongBgClass
const secondaryPressableClass = `${secondaryClass} hover:bg-foreground/20 ${outlineFocusClass}`

// tertiary (based on primary, but with low contrast)
const tertiaryClass = 'bg-primary/20 dark:bg-primary/30'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-primary/40 ${outlineFocusClass}`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-primary/40`

// faint *event* colors
const eventFaintBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,var(--background))]'
const eventFaintPressableClass = joinClassNames(
  eventFaintBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--background))]',
)

// muted *event* colors
const eventMutedFgClass = 'text-[color-mix(in_oklab,var(--fc-event-color)_50%,var(--foreground))]'

// interactive neutral foregrounds
export const mutedFgPressableGroupClass = 'text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground'

export const params: ThemeOptionParams = {
  // outline
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineWidthGroupFocusClass,
  outlineOffsetClass: '',
  outlineInsetClass,
  primaryOutlineColorClass: outlineColorClass,
  tertiaryOutlineColorClass: outlineColorClass,

  // neutral backgrounds
  bgClass: 'bg-background',
  bgRingColorClass: 'ring-background',
  mutedBgClass,
  mutedSolidBgClass: 'bg-muted',
  faintBgClass: 'bg-foreground/3', // semi-transparent version of bg-sidebar

  // neutral foregrounds
  fgClass: '', // inherited
  strongFgClass: '', // inherited
  mutedFgClass: 'text-muted-foreground',
  mutedFgHoverClass: 'hover:text-muted-foreground',
  mutedFgBorderColorClass: 'border-muted-foreground',
  faintFgClass: 'text-muted-foreground',

  // neutral borders
  borderColorClass: '', // inherited
  borderStartColorClass: '', // inherited
  strongBorderColorClass: 'border-foreground/20',
  strongBorderBottomColorClass: 'border-b-foreground/20',
  mutedBorderColorClass: '', // inherited

  // neutral buttons
  strongSolidPressableClass,
  mutedPressableClass: `${mutedBgClass} ${strongBgHoverClass}`,

  // muted-on-hover
  mutedHoverClass: mutedBgHoverClass,
  mutedHoverPressableClass: mutedBgHoverClass, // shadcn doesn't do down-effect
  mutedHoverPressableGroupClass: mutedBgHoverGroupClass, // shadcn doesn't do down-effect

  // faint-on-hover
  faintHoverClass: faintBgHoverClass,
  faintHoverPressableClass: `${faintBgHoverClass} ${faintBgFocusClass}`,

  // popover
  popoverClass: 'border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground',
  popoverHeaderClass: `border-b ${mutedBgClass}`,

  // primary
  primaryClass,
  primaryBorderColorClass: 'border-primary',
  primaryPressableClass,
  primaryPressableGroupClass,

  // secondary
  secondaryClass,
  secondaryPressableClass,

  // tertiary
  tertiaryClass,
  tertiaryPressableClass,
  tertiaryPressableGroupClass,

  // event content
  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  eventMutedBgClass: eventFaintBgClass,
  eventMutedPressableClass: eventFaintPressableClass,
  eventMutedFgClass,
  eventFaintBgClass,
  eventFaintPressableClass,
  bgEventColor: 'var(--foreground)',
  bgEventBgClass: 'bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]',

  // misc event content
  highlightClass: 'bg-primary/10',
  todayBgNotPrintClass: 'not-print:bg-yellow-400/15 dark:bg-yellow-200/10',
  nowBorderColorClass: 'border-destructive',
  nowBorderStartColorClass: 'border-s-destructive',
  nowBorderTopColorClass: 'border-t-destructive',
}
