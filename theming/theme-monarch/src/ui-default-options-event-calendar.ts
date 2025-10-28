import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const outlineWidthClass = 'outline-3'
const outlineWidthFocusClass = 'focus-visible:outline-3'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'

const tertiaryOutlineColorClass = 'outline-(--fc-monarch-outline)' // different that exact tertiary, but same shade
const tertiaryOutlineFocusClass = `${tertiaryOutlineColorClass} ${outlineWidthFocusClass}`

const primaryClass = `bg-(--fc-monarch-primary) text-(--fc-monarch-primary-foreground)`
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-monarch-primary-over) active:bg-(--fc-monarch-primary-down)`
const primaryButtonClass = `${primaryPressableClass} border border-transparent ${tertiaryOutlineFocusClass}`

// TODO: rename? authors of CSS variables might get this confused w/ toolbar styles
const secondaryClass = 'bg-(--fc-monarch-secondary) text-(--fc-monarch-secondary-foreground)'
const secondaryPressableClass = `${secondaryClass} hover:bg-(--fc-monarch-secondary-over) active:bg-(--fc-monarch-secondary-down) ${tertiaryOutlineFocusClass}`

const tertiaryClass = 'bg-(--fc-monarch-tertiary) text-(--fc-monarch-tertiary-foreground)'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-(--fc-monarch-tertiary-over) active:bg-(--fc-monarch-tertiary-down)`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-(--fc-monarch-tertiary-over) group-active:bg-(--fc-monarch-tertiary-down) ${tertiaryOutlineFocusClass}`

const ghostHoverClass = 'hover:bg-(--fc-monarch-muted)'
const ghostHoverGroupClass = 'group-hover:bg-(--fc-monarch-muted)'
const ghostPressableClass = `${ghostHoverClass} focus-visible:bg-(--fc-monarch-muted) active:bg-(--fc-monarch-strong)`
const ghostPressableGroupClass = `${ghostHoverGroupClass} group-focus-visible:bg-(--fc-monarch-muted) group-active:bg-(--fc-monarch-strong)`

// TODO: darker border on focus!!!
// NOTE: different than the "secondary" surface styles given to calendar
const toolbarSecondaryButtonClass = `${ghostPressableClass} border border-(--fc-monarch-secondary-border) ${tertiaryOutlineFocusClass} -outline-offset-1`

// dark grey button
const tabSelectedClass = `bg-(--fc-monarch-selected) text-(--fc-monarch-selected-foreground)`
const tabSelectedPressableClasss = `${tabSelectedClass} hover:bg-(--fc-monarch-selected-over) active:bg-(--fc-monarch-selected-down)`
const tabSelectedButtonClass = `${tabSelectedPressableClasss} border border-transparent ${tertiaryOutlineFocusClass} -outline-offset-1`

const tabUnselectedButtonClass = `${ghostPressableClass} border border-transparent ${tertiaryOutlineFocusClass} -outline-offset-1`

const bgEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]'

const fgGroupPressableClass = 'text-(--fc-monarch-foreground) group-hover:text-(--fc-monarch-strong-foreground) group-focus-visible:text-(--fc-monarch-strong-foreground)'

const mutedFgClass = 'text-(--fc-monarch-muted-foreground)'
export const mutedFgGroupPressableClass = `${mutedFgClass} group-hover:text-(--fc-monarch-foreground) group-focus-visible:text-(--fc-monarch-foreground)`

const faintFgClass = 'text-(--fc-monarch-faint-foreground)'

const buttonIconClass = `size-5 ${fgGroupPressableClass}`

export const optionParams: EventCalendarOptionParams = {
  secondaryClass,
  secondaryPressableClass,

  tertiaryClass,
  tertiaryPressableClass,
  tertiaryPressableGroupClass,

  ghostHoverClass,
  ghostPressableClass,
  ghostPressableGroupClass,

  strongSolidPressableClass: joinClassNames(
    '[background:linear-gradient(var(--fc-monarch-strong),var(--fc-monarch-strong))_var(--fc-monarch-background)]',
    'hover:[background:linear-gradient(var(--fc-monarch-strong-hover),var(--fc-monarch-strong-hover))_var(--fc-monarch-background)]',
    'active:[background:linear-gradient(var(--fc-monarch-strong-active),var(--fc-monarch-strong-active))_var(--fc-monarch-background)]',
  ),

  tertiaryOutlineColorClass,
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

  eventColor: 'var(--fc-monarch-primary)',
  eventContrastColor: 'var(--fc-monarch-primary-foreground)',
  bgEventColor: 'var(--fc-monarch-tertiary)',
  bgEventBgClass,

  popoverClass: 'border border-(--fc-monarch-border) rounded-lg overflow-hidden m-2 bg-(--fc-monarch-popover) text-(--fc-monarch-popover-foreground) shadow-lg',

  bgClass: 'bg-(--fc-monarch-background)',
  bgRingColorClass: 'ring-(--fc-monarch-background)',

  mutedFgClass,
  faintFgClass,
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: `${optionParams.bgClass} border ${optionParams.borderColorClass} rounded-xl overflow-hidden`,

    toolbarClass: 'p-4 items-center gap-3',
    toolbarSectionClass: 'items-center gap-3',
    toolbarTitleClass: 'text-2xl font-bold',

    buttonGroupClass: (data) => [
      'items-center isolate rounded-full',
      data.isSelectGroup && 'border border-(--fc-monarch-border)'
    ],
    buttonClass: (data) => [
      `inline-flex items-center justify-center py-2.5 text-sm rounded-full`,
      data.isIconOnly ? 'px-2.5' : 'px-5',
      data.inSelectGroup && '-m-px', // overcome select-group border
      (data.isIconOnly || (data.inSelectGroup && !data.isSelected))
        ? tabUnselectedButtonClass
        : data.isSelected
          ? tabSelectedButtonClass
          : data.isPrimary
            ? primaryButtonClass
            : toolbarSecondaryButtonClass
    ],

    buttons: {
      prev: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(
            buttonIconClass,
            'rotate-90 [[dir=rtl]_&]:-rotate-90',
          )
        )
      },
      next: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(
            buttonIconClass,
            '-rotate-90 [[dir=rtl]_&]:rotate-90',
          )
        )
      },
      prevYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(
            buttonIconClass,
            '[[dir=rtl]_&]:rotate-180'
          )
        )
      },
      nextYear: {
        iconContent: () => svgs.chevronDoubleLeft(
          joinClassNames(
            buttonIconClass,
            'rotate-180 [[dir=rtl]_&]:rotate-0',
          )
        )
      },
    },

    popoverCloseContent: () => svgs.x(`size-5 ${mutedFgGroupPressableClass}`),
  },
  views: baseEventCalendarOptions.views,
}
