import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

/*
We don't do active: states, because tailwindplus does not do this!
*/

const outlineWidthClass = 'outline-2'
const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'

const primaryOutlineColorClass = `outline-(--fc-breezy-primary)`
const primaryOutlineFocusClass = `${primaryOutlineColorClass} ${outlineWidthFocusClass}`

/*
NOTE: buttons are responsible for border-color, but NOT border-width!
because button groups have strong opinions about adjacent borders and rounded-sides
*/

// no simulated hover-effect when focus-visible,
// because focus-border looks like when same primary color because its spaced away
const primaryClass = 'bg-(--fc-breezy-primary) text-(--fc-breezy-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-breezy-primary-over)`
const primaryPressableGroupClass = `${primaryClass} group-hover:bg-(--fc-breezy-primary-over)`
const primaryButtonClass = `${primaryPressableClass} border-transparent ${primaryOutlineFocusClass} ${outlineOffsetClass}`

const secondaryClass = 'text-(--fc-breezy-secondary-foreground) bg-(--fc-breezy-secondary)'
const secondaryPressableClass = `${secondaryClass} hover:bg-(--fc-breezy-secondary-over)`
const secondaryButtonClass = `${secondaryPressableClass} border-(--fc-breezy-secondary-border) ${primaryOutlineFocusClass} -outline-offset-1`

const mutedHoverClass = 'hover:bg-(--fc-breezy-muted)'
const mutedHoverPressableClass = `${mutedHoverClass} focus-visible:bg-(--fc-breezy-muted)`

const mutedFgClass = 'text-(--fc-breezy-muted-foreground)'
export const mutedFgPressableGroupClass = `${mutedFgClass} group-hover:text-(--fc-breezy-foreground) group-focus-visible:text-(--fc-breezy-foreground)`

const faintHoverClass = 'hover:bg-(--fc-breezy-faint)' // only bg by choice
const faintHoverPressableClass = `${faintHoverClass} active:bg-(--fc-breezy-muted) focus-visible:bg-(--fc-breezy-faint)` // only bg by choice

const buttonIconClass = `size-5 text-(--fc-breezy-secondary-icon) group-hover:text-(--fc-breezy-secondary-icon-over) group-focus-visible:text-(--fc-breezy-secondary-icon-over)`

const selectClass = `bg-(--fc-breezy-selected) text-(--fc-breezy-strong-foreground) ${primaryOutlineFocusClass}`

const nonSelectClass = `text-(--fc-breezy-muted-foreground) hover:text-(--fc-breezy-strong-foreground) ${primaryOutlineFocusClass}`

const eventFaintBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--fc-breezy-background))]'
const eventFaintPressableClass = joinClassNames(
  eventFaintBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--fc-breezy-background))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--fc-breezy-background))]',
)

const mutedEventFgClass = 'text-[color-mix(in_oklab,var(--fc-event-color)_50%,var(--fc-breezy-foreground))]'

const bgEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]'

const fgClass = 'text-(--fc-breezy-foreground)'

export const optionParams: EventCalendarOptionParams = {
  primaryClass,
  primaryPressableClass,
  primaryPressableGroupClass,

  mutedHoverClass,
  mutedHoverPressableClass,

  faintHoverClass,
  faintHoverPressableClass,

  primaryOutlineColorClass,
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineWidthGroupFocusClass,
  outlineOffsetClass,

  strongSolidPressableClass: joinClassNames(
    '[background:linear-gradient(var(--fc-breezy-strong),var(--fc-breezy-strong))_var(--fc-breezy-background)]',
    'hover:[background:linear-gradient(var(--fc-breezy-stronger),var(--fc-breezy-stronger))_var(--fc-breezy-background)]',
    'active:[background:linear-gradient(var(--fc-breezy-strongest),var(--fc-breezy-strongest))_var(--fc-breezy-background)]',
  ),

  mutedBgClass: 'bg-(--fc-breezy-muted)',
  faintBgClass: 'bg-(--fc-breezy-faint)',
  highlightClass: 'bg-(--fc-breezy-highlight)',

  eventColor: 'var(--fc-breezy-event)',
  bgEventColor: 'var(--fc-breezy-background-event)',
  bgEventBgClass,

  borderColorClass: 'border-(--fc-breezy-border)',
  borderStartColorClass: 'border-s-(--fc-breezy-border)',
  primaryBorderColorClass: 'border-(--fc-breezy-primary)',
  strongBorderColorClass: 'border-(--fc-breezy-strong-border)',
  strongBorderBottomColorClass: 'border-b-(--fc-breezy-strong-border)',
  mutedBorderColorClass: 'border-(--fc-breezy-muted-border)',
  nowBorderColorClass: 'border-(--fc-breezy-now)',

  popoverClass: 'bg-(--fc-breezy-popover) border border-(--fc-breezy-popover-border) rounded-lg overflow-hidden shadow-lg m-1',
  popoverHeaderClass: 'border-b border-(--fc-breezy-border) bg-(--fc-breezy-faint) ',

  bgClass: 'bg-(--fc-breezy-background)',
  bgRingColorClass: 'ring-(--fc-breezy-background)',

  faintFgClass: 'text-(--fc-breezy-faint-foreground)',
  mutedFgClass,
  fgClass,
  strongFgClass: 'text-(--fc-breezy-strong-foreground)',

  eventFaintBgClass,
  eventFaintPressableClass,
  mutedEventFgClass,
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: `${optionParams.bgClass} border ${optionParams.borderColorClass} rounded-lg overflow-hidden`,
    headerToolbarClass: `border-b ${optionParams.borderColorClass}`,
    footerToolbarClass: `border-t ${optionParams.borderColorClass}`,

    toolbarClass: `px-4 py-4 items-center ${optionParams.faintBgClass} gap-4`,
    toolbarSectionClass: 'items-center gap-4',
    toolbarTitleClass: `text-lg font-semibold ${optionParams.strongFgClass}`,

    /*
    TODO: don't make buttons so fat
    are buttons 1px taller than in Tailwind Plus because we're not using inset border?
    */
    buttonGroupClass: (data) => [
      'isolate',
      !data.isSelectGroup && `rounded-md shadow-xs`
    ],
    buttonClass: (data) => [
      'inline-flex flex-row py-2 text-sm group', // group for icon group-focus
      data.isIconOnly ? 'px-2' : 'px-3',
      data.inSelectGroup ? joinClassNames(
        // START view-switching bar item
        'rounded-md font-medium',
        data.isSelected
          ? selectClass
          : nonSelectClass,
        // END
      ) : joinClassNames(
        'font-semibold',
        data.isPrimary
          ? primaryButtonClass
          : secondaryButtonClass,
        data.inGroup
          ? 'first:rounded-s-md first:border-s last:rounded-e-md last:border-e border-y'
          // standalone button (responsible for own border and shadow)
          : 'rounded-md shadow-xs border',
      ),
    ],

    buttons: {
      prev: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(buttonIconClass, 'rotate-90 [[dir=rtl]_&]:-rotate-90'),
        ),
      },
      next: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(buttonIconClass, '-rotate-90 [[dir=rtl]_&]:rotate-90'),
        ),
      },
      prevYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(buttonIconClass, '[[dir=rtl]_&]:rotate-180'),
        )
      },
      nextYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(buttonIconClass, 'rotate-180 [[dir=rtl]_&]:rotate-0'),
        )
      },
    },

    popoverCloseContent: () => svgs.x(`size-5 ${mutedFgPressableGroupClass}`),
  },

  views: baseEventCalendarOptions.views,
}
