import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

/*
NOTE: We don't do active: states, because tailwindplus does not do this!
NOTE: buttons are responsible for border-color, but NOT border-width!
  because button groups have strong opinions about adjacent borders and rounded-sides
*/

// outline
const outlineWidthClass = 'outline-2'
const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
const primaryOutlineColorClass = `outline-(--fc-breezy-primary)`
const primaryOutlineFocusClass = `${primaryOutlineColorClass} ${outlineWidthFocusClass}`

// muted-on-hover
const mutedHoverClass = 'hover:bg-(--fc-breezy-muted)'
const mutedHoverPressableClass = `${mutedHoverClass} focus-visible:bg-(--fc-breezy-muted)`

// faint-on-hover
const faintHoverClass = 'hover:bg-(--fc-breezy-faint)'
const faintHoverPressableClass = `${faintHoverClass} active:bg-(--fc-breezy-muted) focus-visible:bg-(--fc-breezy-faint)`

// controls
const selectedClass = `bg-(--fc-breezy-selected) text-(--fc-breezy-strong-foreground) ${primaryOutlineFocusClass}`
const unselectedClass = `text-(--fc-breezy-muted-foreground) hover:text-(--fc-breezy-strong-foreground) ${primaryOutlineFocusClass}`

// primary
const primaryClass = 'bg-(--fc-breezy-primary) text-(--fc-breezy-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-breezy-primary-over)`
const primaryPressableGroupClass = `${primaryClass} group-hover:bg-(--fc-breezy-primary-over)`
const primaryButtonClass = `${primaryPressableClass} border-transparent ${primaryOutlineFocusClass} ${outlineOffsetClass}`

// secondary
const secondaryClass = 'text-(--fc-breezy-secondary-foreground) bg-(--fc-breezy-secondary)'
const secondaryPressableClass = `${secondaryClass} hover:bg-(--fc-breezy-secondary-over)`
const secondaryButtonClass = `${secondaryPressableClass} border-(--fc-breezy-secondary-border) ${primaryOutlineFocusClass} -outline-offset-1`
const secondaryButtonIconClass = `size-5 text-(--fc-breezy-secondary-icon) group-hover:text-(--fc-breezy-secondary-icon-over) group-focus-visible:text-(--fc-breezy-secondary-icon-over)`

// muted *event* colors
const eventMutedFgClass = 'text-[color-mix(in_oklab,var(--fc-event-color)_50%,var(--fc-breezy-foreground))]'

// faint *event* colors
const eventFaintBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--fc-breezy-background))]'
const eventFaintPressableClass = joinClassNames(
  eventFaintBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--fc-breezy-background))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--fc-breezy-background))]',
)

// interactive neutral foregrounds
export const mutedFgPressableGroupClass = `text-(--fc-breezy-muted-foreground) group-hover:text-(--fc-breezy-foreground) group-focus-visible:text-(--fc-breezy-foreground)`

export const params: EventCalendarOptionParams = {
  // outline
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineWidthGroupFocusClass,
  outlineOffsetClass,
  primaryOutlineColorClass,

  // neutral backgrounds
  bgClass: 'bg-(--fc-breezy-background)',
  bgRingColorClass: 'ring-(--fc-breezy-background)',
  mutedBgClass: 'bg-(--fc-breezy-muted)',
  faintBgClass: 'bg-(--fc-breezy-faint)',

  // neutral foregrounds
  fgClass: 'text-(--fc-breezy-foreground)',
  strongFgClass: 'text-(--fc-breezy-strong-foreground)',
  mutedFgClass: 'text-(--fc-breezy-muted-foreground)',
  mutedFgHoverClass: 'hover:text-(--fc-breezy-muted-foreground)',
  faintFgClass: 'text-(--fc-breezy-faint-foreground)',

  // neutral borders
  borderColorClass: 'border-(--fc-breezy-border)',
  borderStartColorClass: 'border-s-(--fc-breezy-border)',
  strongBorderColorClass: 'border-(--fc-breezy-strong-border)',
  strongBorderBottomColorClass: 'border-b-(--fc-breezy-strong-border)',
  mutedBorderColorClass: 'border-(--fc-breezy-muted-border)',

  // strong *button*
  strongSolidPressableClass: joinClassNames(
    '[background:linear-gradient(var(--fc-breezy-strong),var(--fc-breezy-strong))_var(--fc-breezy-background)]',
    'hover:[background:linear-gradient(var(--fc-breezy-stronger),var(--fc-breezy-stronger))_var(--fc-breezy-background)]',
    'active:[background:linear-gradient(var(--fc-breezy-strongest),var(--fc-breezy-strongest))_var(--fc-breezy-background)]',
  ),

  // muted-on-hover
  mutedHoverClass,
  mutedHoverPressableClass,

  // faint-on-hover
  faintHoverClass,
  faintHoverPressableClass,

  // popover
  popoverClass: 'bg-(--fc-breezy-popover) border border-(--fc-breezy-popover-border) rounded-lg overflow-hidden shadow-lg m-1',
  popoverHeaderClass: 'border-b border-(--fc-breezy-border) bg-(--fc-breezy-faint) ',

  // primary
  primaryClass,
  primaryBorderColorClass: 'border-(--fc-breezy-primary)',
  primaryPressableClass,
  primaryPressableGroupClass,

  // secondary
  secondaryClass,
  secondaryPressableClass,

  // event content
  eventColor: 'var(--fc-breezy-event)',
  eventFaintBgClass,
  eventFaintPressableClass,
  eventMutedFgClass,
  bgEventColor: 'var(--fc-breezy-background-event)',
  bgEventBgClass: 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]',

  // misc calendar content
  highlightClass: 'bg-(--fc-breezy-highlight)',
  nowBorderColorClass: 'border-(--fc-breezy-now)',
}

const baseEventCalendarOptions = createEventCalendarOptions(params)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: `bg-(--fc-breezy-background) border border-(--fc-breezy-border) rounded-lg overflow-hidden`,
    headerToolbarClass: `border-b border-(--fc-breezy-border)`,
    footerToolbarClass: `border-t border-(--fc-breezy-border)`,

    toolbarClass: `px-4 py-4 items-center bg-(--fc-breezy-faint) gap-4`,
    toolbarSectionClass: 'items-center gap-4',
    toolbarTitleClass: `text-lg font-semibold text-(--fc-breezy-strong-foreground)`,

    /*
    TODO: don't make buttons so fat
    are buttons 1px taller than in Tailwind Plus because we're not using inset border?
    */
    buttonGroupClass: (data) => [
      'items-center',
      !data.isSelectGroup && `rounded-md shadow-xs`,
    ],
    buttonClass: (data) => [
      'inline-flex flex-row py-2 text-sm group', // group for icon group-focus
      data.isIconOnly ? 'px-2' : 'px-3',
      data.inSelectGroup ? joinClassNames(
        'rounded-md font-medium',
        data.isSelected
          ? selectedClass
          : unselectedClass,
      ) : joinClassNames(
        'font-semibold',
        data.isPrimary
          ? primaryButtonClass
          : secondaryButtonClass,
        data.inGroup
          ? 'first:rounded-s-md first:border-s last:rounded-e-md last:border-e border-y'
          : 'rounded-md shadow-xs border',
      ),
    ],

    buttons: {
      prev: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(secondaryButtonIconClass, 'rotate-90 [[dir=rtl]_&]:-rotate-90'),
        ),
      },
      next: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(secondaryButtonIconClass, '-rotate-90 [[dir=rtl]_&]:rotate-90'),
        ),
      },
      prevYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(secondaryButtonIconClass, '[[dir=rtl]_&]:rotate-180'),
        )
      },
      nextYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(secondaryButtonIconClass, 'rotate-180 [[dir=rtl]_&]:rotate-0'),
        )
      },
    },

    popoverCloseContent: () => svgs.x(`size-5 ${mutedFgPressableGroupClass}`),
  },

  views: baseEventCalendarOptions.views,
}
