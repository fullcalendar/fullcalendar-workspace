import { ThemeOptionParams } from '@fullcalendar/theme-common'

/*
Don't use preconfigured state-specific CSS variables like --mui-palette-action-hover
They often don't look good. And if we use them for semantic purpose other than what they're made for,
(like abusing "hover" for something else) they may look bad when the MUI theme is customized.
*/

const outlineConfigClass = 'outline-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.5)]'
const focusOutlineClass = `focus-visible:outline-3 ${outlineConfigClass}`
const focusOutlineGroupClass = `group-focus-visible:outline-3 ${outlineConfigClass}`
const selectedOutlineClass = `outline-3 ${outlineConfigClass}`

const primaryClass = 'bg-(--mui-palette-primary-main) text-(--mui-palette-primary-contrastText)'
const primaryPressableClass = primaryClass // TODO: hover effect!

// less-contrasty version of primary (like the selected tab)
// TODO: if it looks bad in Classic, make a new mutedPressableClass!
const secondaryClass = 'bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.15)] brightness-110'
const secondaryPressableClass = `${secondaryClass} hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.2)] active:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.3)] focus-visible:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.2)] ${focusOutlineClass}`

// tertiary is actually the secondary (like an accent color)
const tertiaryClass = 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.9)] active:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)] focus-visible:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)] ${focusOutlineClass}`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.9)] group-active:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)] group-focus-visible:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)] ${focusOutlineGroupClass}`

// ghost
const ghostHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.075)]'
const ghostHoverGroupClass = 'group-hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.075)]'
const ghostPressableClass = `${ghostHoverClass} active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)] focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)] ${focusOutlineClass}`
const ghostPressableGroupClass = `${ghostHoverGroupClass} group-active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)] group-focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)] ${focusOutlineGroupClass}`

const faintHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.02)]'
const faintPressableClass = `${faintHoverClass} active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)] focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.02)]`

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
  strongClass: 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]',
  strongPressableClass: 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]',

  // TODO
  mutedClass: 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]',
  mutedPressableClass: 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]',

  faintHoverClass,
  faintPressableClass,

  focusOutlineClass,
  focusOutlineGroupClass,
  selectedOutlineClass,

  strongBgClass: 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]',
  mutedBgClass: 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]',
  faintBgClass: 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]',
  highlightClass: 'bg-(--mui-palette-primary-main) opacity-10',
  todayBgNotPrintClass: 'not-print:bg-[rgba(var(--mui-palette-warning-mainChannel)_/_0.1)]',

  borderColorClass: 'border-(--mui-palette-divider)',
  borderStartColorClass: 'border-s-(--mui-palette-divider)',
  primaryBorderColorClass: 'border-(--mui-palette-primary-main)',
  strongBorderColorClass: 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]',
  strongBorderBottomColorClass: 'border-b-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]',
  mutedBorderColorClass: 'border-(--mui-palette-divider)', // same as standard
  nowBorderColorClass: 'border-(--mui-palette-error-main)',
  nowBorderStartColorClass: 'border-s-(--mui-palette-error-main)',
  nowBorderTopColorClass: 'border-t-(--mui-palette-error-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  bgEventColor: 'var(--mui-palette-secondary-main)',
  bgEventColorClass: 'brightness-115 opacity-15',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8)',
  // (breezy) ^^^
  // (forma) popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8) m-1',
  // (monarch) popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8)',
  // (pulse) popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2',

  bgClass: 'bg-(--mui-palette-background-paper)',
  bgOutlineColorClass: 'outline-(--mui-palette-background-paper)',

  fgClass: 'text-(--mui-palette-text-primary)',
  strongFgClass: 'text-(--mui-palette-text-primary)',
  mutedFgClass: 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
  faintFgClass: 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]',
  // probably use text-(--mui-palette-text-secondary) instead??? is that for buttons or normal text!?
}
