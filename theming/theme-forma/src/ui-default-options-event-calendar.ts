import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

/*
TODO: focus state!?
TODO: focus-outline should be black on everything
TODO: muted text? is #424242 in Outlook
TODO: kill gray-500's
TODO: do primary-button hover effect on today-cirle too
TODO: prev/next icons look a little too faint
*/

const borderColorClass = 'border-(--fc-forma-border)'

const primaryOutlineColorClass = 'outline-(--fc-forma-primary)'
const outlineWidthClass = 'outline-2'
const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
const outlineInsetClass = '-outline-offset-2'
const primaryOutlineFocusClass = `${primaryOutlineColorClass} ${outlineWidthFocusClass}` // does NOT include offset

const primaryClass = 'bg-(--fc-forma-primary) text-(--fc-forma-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-forma-primary-over) focus-visible:bg-(--fc-forma-primary-over) active:bg-(--fc-forma-primary-down)`
const primaryButtonClass = `${primaryPressableClass} border border-transparent ${primaryOutlineFocusClass} ${outlineOffsetClass}`

const ghostHoverClass = 'hover:bg-(--fc-forma-muted)'
const ghostPressableClass = `${ghostHoverClass} active:bg-(--fc-forma-strong) focus-visible:bg-(--fc-forma-strong)`
const ghostButtonClass = `${ghostPressableClass} border border-transparent ${primaryOutlineFocusClass}`

const secondaryButtonClass = `${ghostPressableClass} border ${borderColorClass} ${primaryOutlineFocusClass}`

const mutedBgClass = 'bg-(--fc-forma-muted)'
const mutedFgClass = 'text-(--fc-forma-muted-foreground)'
export const mutedFgGroupPressableClass = `${mutedFgClass} group-hover:text-(--fc-forma-primary) group-focus-visible:text-(--fc-forma-primary)`

const fgGroupPressableClass = `text-(--fc-forma-foreground) group-hover:text-(--fc-forma-strong-foreground) group-focus-visible:text-(--fc-forma-strong-foreground)`

const mutedClass = mutedBgClass // only uses bg
const mutedPressableClass = `${mutedClass} hover:bg-(--fc-forma-strong) active:bg-(--fc-forma-stronger) ${primaryOutlineFocusClass}`

const unselectedButtonTextColorClass = 'text-(--fc-forma-foreground)'
const unselectedButtonHoverBorderColorClass = 'hover:border-(--fc-forma-muted-border)'
const unselectedButtonHoverBgColorClass = 'hover:bg-(--fc-forma-faint)'
const unselectedButtonActiveBgColorClass = 'active:bg-(--fc-forma-strong)'
const unselectedButtonActiveBorderColorClass = 'active:border-(--fc-forma-border)'
const unselectedButtonClass = `${unselectedButtonTextColorClass} border border-transparent ${unselectedButtonHoverBorderColorClass} ${unselectedButtonHoverBgColorClass} ${unselectedButtonActiveBgColorClass} ${unselectedButtonActiveBorderColorClass} ${primaryOutlineFocusClass}`

const selectedButtonBorderColorClass = 'border-(--fc-forma-strong-border)'
const selectedButtonBgColorClass = 'bg-(--fc-forma-selected)'
const selectedButtonHoverBgColorClass = 'hover:bg-(--fc-forma-muted) focus-visible:bg-(--fc-forma-muted)'
const selectedButtonActiveBgColorClass = 'active:bg-(--fc-forma-strong)'
const selectedButtonClass = `border ${selectedButtonBorderColorClass} ${selectedButtonBgColorClass} ${selectedButtonHoverBgColorClass} ${selectedButtonActiveBgColorClass} ${primaryOutlineFocusClass} -outline-offset-1`

const buttonIconClass = `size-5 ${fgGroupPressableClass}`

const strongSolidBgClass = '[background:linear-gradient(var(--fc-forma-strong),var(--fc-forma-strong))_var(--fc-forma-background)]'
const strongSolidPressableClass = joinClassNames(
  strongSolidBgClass,
  'hover:[background:linear-gradient(var(--fc-forma-stronger),var(--fc-forma-stronger))_var(--fc-monarch-background)]',
  'active:[background:linear-gradient(var(--fc-forma-strongest),var(--fc-forma-strongest))_var(--fc-monarch-background)]',
)

const faintEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--fc-forma-background))]'
const faintEventPressableClass = joinClassNames(
  faintEventBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--fc-forma-background))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--fc-forma-background))]',
)

const mutedEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--fc-forma-background))]'
const mutedEventPressableClass = joinClassNames(
  mutedEventBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_35%,var(--fc-forma-background))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_40%,var(--fc-forma-background))]',
)

const bgEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]'

export const optionParams: EventCalendarOptionParams = {
  primaryClass,
  primaryPressableClass,

  ghostHoverClass,
  ghostPressableClass,

  mutedBgClass,

  mutedClass,
  mutedPressableClass,
  strongSolidPressableClass,

  faintBgClass: 'bg-(--fc-forma-faint)',
  highlightClass: 'bg-(--fc-forma-highlight)',

  borderColorClass,
  primaryBorderColorClass: 'border-(--fc-forma-primary)',
  strongBorderColorClass: 'border-(--fc-forma-strong-border)',
  nowBorderColorClass: 'border-(--fc-forma-primary)', // same as primary

  primaryOutlineColorClass,
  outlineWidthClass,
  outlineWidthFocusClass,
  outlineOffsetClass,
  outlineInsetClass,

  eventColor: 'var(--fc-forma-event)',
  eventContrastColor: 'var(--fc-forma-event-contrast)',
  bgEventColor: 'var(--fc-forma-background-event)',
  bgEventBgClass,

  popoverClass: 'border border-(--fc-forma-border) bg-(--fc-forma-background) shadow-md',
  popoverHeaderClass: `border-b border-(--fc-forma-border) bg-(--fc-forma-faint)`,

  bgClass: 'bg-(--fc-forma-background)',
  bgRingColorClass: 'ring-(--fc-forma-background)',

  mutedFgClass,
  faintFgClass: 'text-(--fc-forma-faint-foreground)',

  mutedEventBgClass,
  mutedEventPressableClass,
  faintEventBgClass,
  faintEventPressableClass,
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: `${optionParams.bgClass} border ${optionParams.borderColorClass} rounded-sm shadow-xs overflow-hidden`,
    headerToolbarClass: `border-b ${optionParams.borderColorClass}`,
    footerToolbarClass: `border-t ${optionParams.borderColorClass}`,

    toolbarClass: 'p-3 items-center gap-3', // TODO: document how we do NOT need to justify-between or flex-row
    toolbarSectionClass: 'items-center gap-3',
    toolbarTitleClass: 'text-xl',

    buttonGroupClass: 'items-center isolate',
    buttonClass: (data) => [
      'inline-flex flex-row text-sm py-1.5 rounded-sm group',
      data.isIconOnly ? 'px-2' : 'px-3',
      data.isIconOnly
        // ghost-button
        ? ghostButtonClass
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
          joinClassNames(buttonIconClass, 'rotate-90 [[dir=rtl]_&]:-rotate-90'),
        )
      },
      next: {
        iconContent: () => svgs.chevronDown(
          joinClassNames(buttonIconClass, '-rotate-90 [[dir=rtl]_&]:rotate-90'),
        )
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

    popoverCloseContent: () => svgs.dismiss(`size-5 ${mutedFgGroupPressableClass}`),
  },
  views: baseEventCalendarOptions.views,
}
