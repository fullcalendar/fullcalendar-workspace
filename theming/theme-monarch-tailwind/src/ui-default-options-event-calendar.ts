import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

// outline
const outlineWidthClass = 'outline-3'
const outlineWidthFocusClass = 'focus-visible:outline-3'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'
const outlineColorClass = 'outline-(--fc-monarch-outline)'
const outlineFocusClass = `${outlineColorClass} ${outlineWidthFocusClass}`

// neutral buttons
const strongSolidPressableClass = joinClassNames(
  '[background:linear-gradient(var(--fc-monarch-strong),var(--fc-monarch-strong))_var(--fc-monarch-background)]',
  'hover:[background:linear-gradient(var(--fc-monarch-stronger),var(--fc-monarch-stronger))_var(--fc-monarch-background)]',
  'active:[background:linear-gradient(var(--fc-monarch-strongest),var(--fc-monarch-strongest))_var(--fc-monarch-background)]',
)
const mutedHoverClass = 'hover:bg-(--fc-monarch-muted)'
const mutedHoverGroupClass = 'group-hover:bg-(--fc-monarch-muted)'
const mutedHoverPressableClass = `${mutedHoverClass} focus-visible:bg-(--fc-monarch-muted) active:bg-(--fc-monarch-strong)`
const mutedHoverPressableGroupClass = `${mutedHoverGroupClass} group-focus-visible:bg-(--fc-monarch-muted) group-active:bg-(--fc-monarch-strong)`

// controls
const selectedClass = `bg-(--fc-monarch-selected) text-(--fc-monarch-selected-foreground)`
const selectedPressableClasss = `${selectedClass} hover:bg-(--fc-monarch-selected-over) active:bg-(--fc-monarch-selected-down)`
const selectedButtonClass = `${selectedPressableClasss} border border-transparent ${outlineFocusClass} -outline-offset-1`
const unselectedButtonClass = `${mutedHoverPressableClass} border border-transparent ${outlineFocusClass} -outline-offset-1`

// primary
const primaryClass = `bg-(--fc-monarch-primary) text-(--fc-monarch-primary-foreground)`
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-monarch-primary-over) active:bg-(--fc-monarch-primary-down)`
const primaryButtonClass = `${primaryPressableClass} border border-transparent ${outlineFocusClass}`

// secondary *calendar content* (has muted color)
const secondaryClass = 'bg-(--fc-monarch-secondary) text-(--fc-monarch-secondary-foreground)'
const secondaryPressableClass = `${secondaryClass} hover:bg-(--fc-monarch-secondary-over) active:bg-(--fc-monarch-secondary-down) ${outlineFocusClass}`

// secondary *toolbar button* (neutral)
const secondaryButtonClass = `${mutedHoverPressableClass} border border-(--fc-monarch-strong-border) ${outlineFocusClass} -outline-offset-1`
const secondaryButtonIconClass = `size-5 text-(--fc-monarch-foreground) group-hover:text-(--fc-monarch-strong-foreground) group-focus-visible:text-(--fc-monarch-strong-foreground)`

// tertiary
const tertiaryClass = 'bg-(--fc-monarch-tertiary) text-(--fc-monarch-tertiary-foreground)'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-(--fc-monarch-tertiary-over) active:bg-(--fc-monarch-tertiary-down)`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-(--fc-monarch-tertiary-over) group-active:bg-(--fc-monarch-tertiary-down) ${outlineFocusClass}`

// interactive neutral foregrounds
export const mutedFgPressableGroupClass = 'text-(--fc-monarch-muted-foreground) group-hover:text-(--fc-monarch-foreground) group-focus-visible:text-(--fc-monarch-foreground)'

export const params: EventCalendarOptionParams = {
  // outline
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineWidthGroupFocusClass,
  tertiaryOutlineColorClass: outlineColorClass, // treat as tertiary

  // neutral backgrounds
  bgClass: 'bg-(--fc-monarch-background)',
  bgRingColorClass: 'ring-(--fc-monarch-background)',
  mutedBgClass: 'bg-(--fc-monarch-muted)',
  faintBgClass: 'bg-(--fc-monarch-faint)',

  // neutral foregrounds
  mutedFgClass: 'text-(--fc-monarch-muted-foreground)',
  faintFgClass: 'text-(--fc-monarch-faint-foreground)',

  // neutral borders
  borderColorClass: 'border-(--fc-monarch-border)',
  strongBorderColorClass: 'border-(--fc-monarch-strong-border)',
  primaryBorderColorClass: 'border-(--fc-monarch-primary)',

  // neutral buttons
  strongSolidPressableClass,
  mutedHoverClass,
  mutedHoverPressableClass,
  mutedHoverPressableGroupClass,

  // popover
  popoverClass: 'border border-(--fc-monarch-border) rounded-lg overflow-hidden m-2 bg-(--fc-monarch-popover) text-(--fc-monarch-popover-foreground) shadow-lg',

  // secondary
  secondaryClass,
  secondaryPressableClass,

  // tertiary
  tertiaryClass,
  tertiaryPressableClass,
  tertiaryPressableGroupClass,

  // event content
  eventColor: 'var(--fc-monarch-event)',
  eventContrastColor: 'var(--fc-monarch-event-contrast)',
  bgEventColor: 'var(--fc-monarch-tertiary)',
  bgEventBgClass: 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]',

  // misc content
  highlightClass: 'bg-(--fc-monarch-highlight)',
  nowBorderColorClass: 'border-(--fc-monarch-now)',
}

const baseEventCalendarOptions = createEventCalendarOptions(params)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: 'bg-(--fc-monarch-background) border border-(--fc-monarch-border) rounded-xl overflow-hidden',

    /* Toolbar
    --------------------------------------------------------------------------------------------- */

    toolbarClass: 'p-4 flex flex-row flex-wrap items-center justify-between gap-3',
    toolbarSectionClass: 'shrink-0 flex flex-row items-center gap-3',
    toolbarTitleClass: 'text-2xl font-bold',

    buttonGroupClass: (data) => [
      'rounded-full flex flex-row items-center',
      data.isSelectGroup && 'border border-(--fc-monarch-border)'
    ],
    buttonClass: (data) => [
      'py-2.5 rounded-full flex flex-row items-center text-sm',
      data.isIconOnly ? 'px-2.5' : 'px-5',
      data.inSelectGroup && '-m-px', // overcome select-group border
      (data.isIconOnly || (data.inSelectGroup && !data.isSelected))
        ? unselectedButtonClass
        : data.isSelected
          ? selectedButtonClass
          : data.isPrimary
            ? primaryButtonClass
            : secondaryButtonClass
    ],

    buttons: {
      prev: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(
            secondaryButtonIconClass,
            'rotate-90 [[dir=rtl]_&]:-rotate-90',
          )
        )
      },
      next: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(
            secondaryButtonIconClass,
            '-rotate-90 [[dir=rtl]_&]:rotate-90',
          )
        )
      },
      prevYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(
            secondaryButtonIconClass,
            '[[dir=rtl]_&]:rotate-180'
          )
        )
      },
      nextYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(
            secondaryButtonIconClass,
            'rotate-180 [[dir=rtl]_&]:rotate-0',
          )
        )
      },
    },

    /* Popover
    --------------------------------------------------------------------------------------------- */

    popoverCloseContent: () => svgs.x(`size-5 ${mutedFgPressableGroupClass}`),
  },
  views: baseEventCalendarOptions.views,
}
