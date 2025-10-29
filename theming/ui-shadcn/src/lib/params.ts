import { joinClassNames } from '@fullcalendar/core'
import { ThemeOptionParams } from '@fullcalendar/theme-common'

// outline
const outlineWidthClass = 'outline-3'
const outlineWidthFocusClass = 'focus-visible:outline-3'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'
const outlineInsetClass = '-outline-offset-3'
const outlineColorClass = 'outline-ring/50'
const outlineFocusClass = `${outlineColorClass} ${outlineWidthFocusClass}`

// faint
const faintBgHoverClass = 'hover:bg-muted/50'
const faintBgFocusClass = 'focus-visible:bg-muted/50'

// muted
const mutedBgClass = 'bg-foreground/5'
const mutedBgHoverClass = 'hover:bg-foreground/5'
const mutedBgHoverGroupClass = 'group-hover:bg-foreground/5'

// strong
const strongBgClass = 'bg-foreground/10'
const strongBgHoverClass = 'hover:bg-foreground/10'
// (guaranteed-solid... shadcn input variables already solid before color-mix)
const strongSolidClass = 'bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))]'
const strongSolidPressableClass = `${strongSolidClass} hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))]`

// interactive neutral foregrounds
const mutedFgPressableGroupClass = 'text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground'

// primary
const primaryClass = 'bg-primary text-(--primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-primary/90`
const primaryPressableGroupClass = `${primaryClass} group-hover:bg-primary/90`

// secondary
const secondaryClass = strongBgClass
const secondaryPressableClass = `${secondaryClass} hover:bg-foreground/20 ${outlineFocusClass}`

// tertiary (based on primary, but with low contrast)
const tertiaryClass = 'bg-primary/20 dark:bg-primary/30'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-primary/40 ${outlineFocusClass}`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-primary/40`

// event colors
const eventFaintBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--background))]'
const eventFaintPressableClass = joinClassNames(
  eventFaintBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--background))]',
)
const eventMutedBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--background))]'
const eventMutedPressableClass = joinClassNames(
  eventMutedBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_35%,var(--background))]',
)
const eventMutedFgClass = 'text-[color-mix(in_oklab,var(--fc-event-color)_50%,var(--foreground))]'
const bgEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]'

export { mutedFgPressableGroupClass }

export const optionParams: ThemeOptionParams = {
  primaryClass,
  primaryPressableClass,
  primaryPressableGroupClass,

  secondaryClass,
  secondaryPressableClass,

  tertiaryClass,
  tertiaryPressableClass,
  tertiaryPressableGroupClass,

  mutedHoverClass: mutedBgHoverClass,
  mutedHoverPressableClass: mutedBgHoverClass, // shadcn doesn't do down-effect
  mutedHoverPressableGroupClass: mutedBgHoverGroupClass, // shadcn doesn't do down-effect

  strongSolidPressableClass,

  mutedClass: mutedBgClass,
  mutedPressableClass: `${mutedBgClass} ${strongBgHoverClass}`,

  faintHoverClass: faintBgHoverClass,
  faintHoverPressableClass: `${faintBgHoverClass} ${faintBgFocusClass}`,

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

  popoverClass: 'border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground',
  // (breezy) popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',
  // (classic) popoverClass: 'border bg-background text-foreground shadow-lg',
  // (forma) popoverClass: 'border bg-background text-foreground shadow-md',
  // (monarch) popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',
  // (pulse) popoverClass: 'border bg-background text-foreground shadow-lg rounded-md shadow-md m-1',

  popoverHeaderClass: `border-b ${mutedBgClass}`,

  bgClass: 'bg-background',
  bgRingColorClass: 'ring-background',

  fgClass: '',
  strongFgClass: '',
  mutedFgClass: 'text-muted-foreground',
  faintFgClass: 'text-muted-foreground',

  eventFaintBgClass,
  eventFaintPressableClass,
  eventMutedBgClass,
  eventMutedPressableClass,
  eventMutedFgClass,
}
