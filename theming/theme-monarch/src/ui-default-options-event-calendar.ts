import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

// outline
const outlineWidthClass = 'outline-3'
const outlineWidthFocusClass = 'focus-visible:outline-3'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'
const outlineColorClass = 'outline-(--fc-monarch-outline)'
const outlineFocusClass = `${outlineColorClass} ${outlineWidthFocusClass}`

// interactive neutral backgrounds
const mutedHoverClass = 'hover:bg-(--fc-monarch-muted)'
const mutedHoverGroupClass = 'group-hover:bg-(--fc-monarch-muted)'
const mutedHoverPressableClass = `${mutedHoverClass} focus-visible:bg-(--fc-monarch-muted) active:bg-(--fc-monarch-strong)`
const mutedHoverPressableGroupClass = `${mutedHoverGroupClass} group-focus-visible:bg-(--fc-monarch-muted) group-active:bg-(--fc-monarch-strong)`
const strongSolidPressableClass = joinClassNames(
  '[background:linear-gradient(var(--fc-monarch-strong),var(--fc-monarch-strong))_var(--fc-monarch-background)]',
  'hover:[background:linear-gradient(var(--fc-monarch-stronger),var(--fc-monarch-stronger))_var(--fc-monarch-background)]',
  'active:[background:linear-gradient(var(--fc-monarch-strongest),var(--fc-monarch-strongest))_var(--fc-monarch-background)]',
)

// interactive neutral foregrounds
const fgPressableGroupClass = 'text-(--fc-monarch-foreground) group-hover:text-(--fc-monarch-strong-foreground) group-focus-visible:text-(--fc-monarch-strong-foreground)'
const mutedFgPressableGroupClass = 'text-(--fc-monarch-muted-foreground) group-hover:text-(--fc-monarch-foreground) group-focus-visible:text-(--fc-monarch-foreground)'

// primary
const primaryClass = `bg-(--fc-monarch-primary) text-(--fc-monarch-primary-foreground)`
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-monarch-primary-over) active:bg-(--fc-monarch-primary-down)`
const primaryButtonClass = `${primaryPressableClass} border border-transparent ${outlineFocusClass}`

// secondary *calendar content* (has muted color)
const secondaryClass = 'bg-(--fc-monarch-secondary) text-(--fc-monarch-secondary-foreground)'
const secondaryPressableClass = `${secondaryClass} hover:bg-(--fc-monarch-secondary-over) active:bg-(--fc-monarch-secondary-down) ${outlineFocusClass}`

// secondary *toolbar button* (neutral)
const secondaryButtonClass = `${mutedHoverPressableClass} border border-(--fc-monarch-strong-border) ${outlineFocusClass} -outline-offset-1`
const secondaryButtonIconClass = `size-5 ${fgPressableGroupClass}`

// tertiary
const tertiaryClass = 'bg-(--fc-monarch-tertiary) text-(--fc-monarch-tertiary-foreground)'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-(--fc-monarch-tertiary-over) active:bg-(--fc-monarch-tertiary-down)`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-(--fc-monarch-tertiary-over) group-active:bg-(--fc-monarch-tertiary-down) ${outlineFocusClass}`

// controls
const selectedClass = `bg-(--fc-monarch-selected) text-(--fc-monarch-selected-foreground)`
const selectedPressableClasss = `${selectedClass} hover:bg-(--fc-monarch-selected-over) active:bg-(--fc-monarch-selected-down)`
const selectedButtonClass = `${selectedPressableClasss} border border-transparent ${outlineFocusClass} -outline-offset-1`
const unselectedButtonClass = `${mutedHoverPressableClass} border border-transparent ${outlineFocusClass} -outline-offset-1`

export { mutedFgPressableGroupClass }

export const optionParams: EventCalendarOptionParams = {
  secondaryClass,
  secondaryPressableClass,

  tertiaryClass,
  tertiaryPressableClass,
  tertiaryPressableGroupClass,

  mutedHoverClass,
  mutedHoverPressableClass,
  mutedHoverPressableGroupClass,

  strongSolidPressableClass,

  tertiaryOutlineColorClass: outlineColorClass, // treat as tertiary
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineWidthGroupFocusClass,

  mutedBgClass: 'bg-(--fc-monarch-muted)',
  faintBgClass: 'bg-(--fc-monarch-faint)',
  highlightClass: 'bg-(--fc-monarch-highlight)',

  borderColorClass: 'border-(--fc-monarch-border)',
  primaryBorderColorClass: 'border-(--fc-monarch-primary)',
  strongBorderColorClass: 'border-(--fc-monarch-strong-border)',
  nowBorderColorClass: 'border-(--fc-monarch-now)',

  eventColor: 'var(--fc-monarch-event)',
  eventContrastColor: 'var(--fc-monarch-event-contrast)',
  bgEventColor: 'var(--fc-monarch-tertiary)',
  bgEventBgClass: 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]',

  popoverClass: 'border border-(--fc-monarch-border) rounded-lg overflow-hidden m-2 bg-(--fc-monarch-popover) text-(--fc-monarch-popover-foreground) shadow-lg',

  bgClass: 'bg-(--fc-monarch-background)',
  bgRingColorClass: 'ring-(--fc-monarch-background)',

  mutedFgClass: 'text-(--fc-monarch-muted-foreground)',
  faintFgClass: 'text-(--fc-monarch-faint-foreground)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: `bg-(--fc-monarch-background) border border-(--fc-monarch-border) rounded-xl overflow-hidden`,

    toolbarClass: 'p-4 items-center gap-3',
    toolbarSectionClass: 'items-center gap-3',
    toolbarTitleClass: 'text-2xl font-bold',

    buttonGroupClass: (data) => [
      'items-center rounded-full',
      data.isSelectGroup && 'border border-(--fc-monarch-border)'
    ],
    buttonClass: (data) => [
      `inline-flex items-center justify-center py-2.5 text-sm rounded-full`,
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

    popoverCloseContent: () => svgs.x(`size-5 ${mutedFgPressableGroupClass}`),
  },
  views: baseEventCalendarOptions.views,
}
