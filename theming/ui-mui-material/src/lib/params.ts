import { joinClassNames } from '@fullcalendar/core'
import { ThemeOptionParams } from '@fullcalendar/theme-common'

/*
Don't use preconfigured state-specific CSS variables like --mui-palette-action-hover
They often don't look good. And if we use them for semantic purpose other than what they're made for,
(like abusing "hover" for something else) they may look bad when the MUI theme is customized.

NOTE: the norm for MUI's focus on a ghost-like element is to do a pretty dark bg

for guaranteed-solid... MUI input variables already solid before color-mix
*/

// outline
const outlineWidthClass = 'outline-3'
const outlineWidthFocusClass = 'focus-visible:outline-3'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'
const outlineOffsetClass = 'outline-offset-1'
const outlineInsetClass = '-outline-offset-3'
const primaryOutlineColorClass = 'outline-(--mui-palette-primary-main)'
const tertiaryOutlineColorClass = 'outline-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.5)]'

// primary
const primaryClass = 'bg-(--mui-palette-primary-main) text-(--mui-palette-primary-contrastText)'
const primaryPressableClass = `${primaryClass} hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.9)] active:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.8)]`
const primaryPressableGroupClass = `${primaryClass} group-hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.9)] group-active:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.8)]`

// secondary (less-contrasty version of primary)
const secondaryClass = 'bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.15)] brightness-110'
const secondaryPressableClass = `${secondaryClass} hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.2)] active:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.3)]`

// tertiary (it's actually MUI's "secondary", like an accent color)
const tertiaryClass = 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.9)] active:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)]`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.9)] group-active:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)]`

// strongest (25%)
const strongestSolidBgActiveClass = 'active:bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_25%,var(--mui-palette-background-paper))]'

// stronger (20%)
const strongerBgActiveClass = 'active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]'
const strongerSolidBgHoverClass = 'hover:bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_20%,var(--mui-palette-background-paper))]'

// strong (15%)
const strongBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]'
const strongBgFocusClass = 'focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]'
const strongBgFocusGroupClass = 'group-focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]'
const strongBgActiveClass = 'active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]'
const strongBgActiveGroupClass = 'group-active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]'
const strongSolidBgClass = 'bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_15%,var(--mui-palette-background-paper))]'
const strongSolidPressableClass = `${strongSolidBgClass} ${strongerSolidBgHoverClass} ${strongestSolidBgActiveClass}`

// muted (7.5%)
const mutedBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.075)]'
const mutedBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.075)]'
const mutedBgHoverGroupClass = 'group-hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.075)]'
const mutedBgActiveClass = 'active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.075)]'
const mutedPressableClass = `${mutedBgClass} ${strongBgHoverClass} ${strongerBgActiveClass}`
const mutedHoverPressableClass = `${mutedBgHoverClass} ${strongBgFocusClass} ${strongBgActiveClass}`
const mutedHoverPressableGroupClass = `${mutedBgHoverGroupClass} ${strongBgFocusGroupClass} ${strongBgActiveGroupClass}`
const mutedSolidBgClass = '[background:linear-gradient(rgba(var(--mui-palette-text-primaryChannel)_/_0.075),rgba(var(--mui-palette-text-primaryChannel)_/_0.075))_var(--mui-palette-background-paper)]'

// faint (4%)
const faintBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
const faintBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
const faintBgFocusClass = 'focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
const faintHoverPressableClass = `${faintBgHoverClass} ${mutedBgActiveClass} ${faintBgFocusClass}`

// muted *event* colors
const eventMutedFgClass = 'text-[color-mix(in_oklab,var(--fc-event-color)_50%,var(--mui-palette-text-primary))]'
const eventMutedBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--mui-palette-background-paper))]'
const eventMutedPressableClass = joinClassNames(
  eventMutedBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_35%,var(--mui-palette-background-paper))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_40%,var(--mui-palette-background-paper))]',
)

// faint *event* colors
const eventFaintBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--mui-palette-background-paper))]'
const eventFaintPressableClass = joinClassNames(
  eventFaintBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--mui-palette-background-paper))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--mui-palette-background-paper))]',
)

// this is how MUI does icon color
export const pressableIconClass = 'text-(--mui-palette-action-active) group-hover:text-(--mui-palette-text-primary) group-focus-visible:text-(--mui-palette-text-primary)'

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
  mutedHoverPressableClass,
  mutedHoverPressableGroupClass,

  strongSolidPressableClass,

  mutedClass: mutedBgClass,
  mutedPressableClass,

  faintHoverClass: faintBgHoverClass,
  faintHoverPressableClass,

  primaryOutlineColorClass,
  tertiaryOutlineColorClass,
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineWidthGroupFocusClass,
  outlineOffsetClass,
  outlineInsetClass,

  mutedBgClass,
  mutedSolidBgClass,
  faintBgClass,
  highlightClass: 'bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.1)]',
  todayBgNotPrintClass: 'not-print:bg-[rgba(var(--mui-palette-warning-mainChannel)_/_0.1)]',

  borderColorClass: 'border-(--mui-palette-divider)',
  borderStartColorClass: 'border-s-(--mui-palette-divider)',
  primaryBorderColorClass: 'border-(--mui-palette-primary-main)',
  strongBorderColorClass: 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]',
  strongBorderBottomColorClass: 'border-b-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]',
  mutedBorderColorClass: 'border-(--mui-palette-divider)',
  nowBorderColorClass: 'border-(--mui-palette-error-main)',
  nowBorderStartColorClass: 'border-s-(--mui-palette-error-main)',
  nowBorderTopColorClass: 'border-t-(--mui-palette-error-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  bgEventColor: 'var(--mui-palette-secondary-main)',
  bgEventBgClass: 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-1',
  // (breezy) ^^^
  // (forma) popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8) m-1',
  // (monarch) popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8)',
  // (pulse) popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2',

  popoverHeaderClass: 'border-b border-(--mui-palette-divider)', // no bg color. looks bad with card shadow

  bgClass: 'bg-(--mui-palette-background-paper)',
  bgRingColorClass: 'ring-(--mui-palette-background-paper)',

  fgClass: 'text-(--mui-palette-text-primary)',
  strongFgClass: 'text-(--mui-palette-text-primary)',
  mutedFgClass: 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
  faintFgClass: 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]',
  // probably use text-(--mui-palette-text-secondary) instead??? is that for buttons or normal text!?

  eventFaintBgClass,
  eventFaintPressableClass,
  eventMutedBgClass,
  eventMutedPressableClass,
  eventMutedFgClass,
}
