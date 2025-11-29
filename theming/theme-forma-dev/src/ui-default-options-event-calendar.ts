import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

// outline
const outlineWidthClass = 'outline-2'
const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
const outlineInsetClass = '-outline-offset-2'
const primaryOutlineColorClass = 'outline-(--fc-forma-primary)'
const primaryOutlineFocusClass = `${outlineWidthFocusClass} ${primaryOutlineColorClass}`

// neutral buttons
const strongSolidPressableClass = joinClassNames(
  '[background:linear-gradient(var(--fc-forma-strong),var(--fc-forma-strong))_var(--fc-forma-background)]',
  'hover:[background:linear-gradient(var(--fc-forma-stronger),var(--fc-forma-stronger))_var(--fc-monarch-background)]',
  'active:[background:linear-gradient(var(--fc-forma-strongest),var(--fc-forma-strongest))_var(--fc-monarch-background)]',
)
const mutedPressableClass = `bg-(--fc-forma-muted) hover:bg-(--fc-forma-strong) active:bg-(--fc-forma-stronger) ${primaryOutlineFocusClass}`
const mutedHoverClass = 'hover:bg-(--fc-forma-muted)'
const mutedHoverPressableClass = `${mutedHoverClass} focus-visible:bg-(--fc-forma-muted) active:bg-(--fc-forma-strong)`
const mutedHoverButtonClass = `${mutedHoverPressableClass} border border-transparent ${primaryOutlineFocusClass}`

// controls
const unselectedPressableClass = `${mutedHoverPressableClass}`
const unselectedButtonClass = `${unselectedPressableClass} border border-transparent ${primaryOutlineFocusClass}`
const selectedButtonClass = `bg-(--fc-forma-muted) border border-(--fc-forma-strong-border) ${primaryOutlineFocusClass} -outline-offset-1`

// primary
const primaryClass = 'bg-(--fc-forma-primary) text-(--fc-forma-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-forma-primary-over) focus-visible:bg-(--fc-forma-primary-over) active:bg-(--fc-forma-primary-down)`
const primaryButtonClass = `${primaryPressableClass} border border-transparent ${primaryOutlineFocusClass} ${outlineOffsetClass}`

// secondary *toolbar button*
const secondaryButtonClass = `${mutedHoverPressableClass} border border-(--fc-forma-border) hover:border-(--fc-forma-strong-border) ${primaryOutlineFocusClass}`
const secondaryButtonIconClass = 'size-5'

// event content
const eventMutedBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--fc-forma-background))]'
const eventMutedPressableClass = joinClassNames(
  eventMutedBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_35%,var(--fc-forma-background))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_40%,var(--fc-forma-background))]',
)
const eventFaintBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--fc-forma-background))]'
const eventFaintPressableClass = joinClassNames(
  eventFaintBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--fc-forma-background))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--fc-forma-background))]',
)

// interactive neutral foregrounds
export const mutedFgPressableGroupClass = `text-(--fc-forma-muted-foreground) group-hover:text-(--fc-forma-primary) group-focus-visible:text-(--fc-forma-primary)`

export const params: EventCalendarOptionParams = {
  // outline
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineOffsetClass,
  outlineInsetClass,
  primaryOutlineColorClass,

  // neutral backgrounds
  bgClass: 'bg-(--fc-forma-background)',
  bgRingColorClass: 'ring-(--fc-forma-background)',
  mutedBgClass: 'bg-(--fc-forma-muted)',
  faintBgClass: 'bg-(--fc-forma-faint)',

  // neutral foregrounds
  faintFgClass: 'text-(--fc-forma-faint-foreground)',
  mutedFgClass: 'text-(--fc-forma-muted-foreground)',
  mutedFgBorderColorClass: 'border-(--fc-forma-muted-foreground)',

  // neutral borders
  borderColorClass: 'border-(--fc-forma-border)',
  strongBorderColorClass: 'border-(--fc-forma-strong-border)',

  // neutral buttons
  strongSolidPressableClass,
  mutedPressableClass,
  mutedHoverClass,
  mutedHoverPressableClass,

  // popover
  popoverClass: 'border border-(--fc-forma-border) bg-(--fc-forma-background) shadow-md',
  popoverHeaderClass: `border-b border-(--fc-forma-border) bg-(--fc-forma-faint)`,

  // primary
  primaryClass,
  primaryBorderColorClass: 'border-(--fc-forma-primary)',
  primaryPressableClass,

  // event content
  eventColor: 'var(--fc-forma-event)',
  eventContrastColor: 'var(--fc-forma-event-contrast)',
  eventFaintBgClass,
  eventFaintPressableClass,
  eventMutedBgClass,
  eventMutedPressableClass,
  bgEventColor: 'var(--fc-forma-background-event)',
  bgEventBgClass: 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]',

  // misc content
  highlightClass: 'bg-(--fc-forma-highlight)',
  nowBorderColorClass: 'border-(--fc-forma-primary)', // same as primary
}

const baseEventCalendarOptions = createEventCalendarOptions(params)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: 'bg-(--fc-forma-background) border border-(--fc-forma-border) rounded-sm shadow-xs overflow-hidden',

    /* Toolbar
    --------------------------------------------------------------------------------------------- */

    headerToolbarClass: 'border-b border-(--fc-forma-border)',
    footerToolbarClass: 'border-t border-(--fc-forma-border)',

    toolbarClass: 'p-3 flex flex-row flex-wrap items-center justify-between gap-3',
    toolbarSectionClass: 'shrink-0 flex flex-row items-center gap-3',
    toolbarTitleClass: 'text-xl',

    buttonGroupClass: 'flex flex-row items-center',
    buttonClass: (data) => [
      'group py-1.5 rounded-sm flex flex-row items-center text-sm',
      data.isIconOnly ? 'px-2' : 'px-3',
      data.isIconOnly
        // ghost-button
        ? mutedHoverButtonClass
        : data.inSelectGroup
          ? data.isSelected
            // select-group SELECTED
            ? selectedButtonClass
            // select-group NOT-selected
            : unselectedButtonClass
          : data.isPrimary
            // primary button
            ? primaryButtonClass
            // secondary button
            : secondaryButtonClass,
    ],

    buttons: {
      prev: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(secondaryButtonIconClass, 'rotate-90 [[dir=rtl]_&]:-rotate-90'),
        )
      },
      next: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(secondaryButtonIconClass, '-rotate-90 [[dir=rtl]_&]:rotate-90'),
        )
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

    /* Popover
    --------------------------------------------------------------------------------------------- */

    popoverCloseContent: () => svgs.dismiss(`size-5 ${mutedFgPressableGroupClass}`),
  },
  views: baseEventCalendarOptions.views,
}
