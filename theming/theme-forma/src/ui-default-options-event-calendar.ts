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
TODO: focus color on secondary button

TODO: rename glassy/cloudy css variables
*/

const primaryClass = 'bg-(--fc-forma-primary) text-(--fc-forma-primary-foreground)'
const primaryPressableClass = primaryClass // TODO: add --fc-forma-primary-over effects!!!

const secondaryClass = 'bg-(--fc-forma-muted)'
const secondaryPressableClass = secondaryClass // TODO: add effects!!!

const ghostHoverClass = 'hover:bg-(--fc-forma-muted)'
const ghostPressableClass = `${ghostHoverClass} focus-visible:bg-(--fc-forma-strong)`

export const optionParams: EventCalendarOptionParams = { // TODO: rename to defaultUiParams?
  primaryClass,
  primaryPressableClass,

  secondaryClass,
  secondaryPressableClass,

  ghostHoverClass,
  ghostPressableClass,

  // TODO
  mutedClass: 'bg-(--fc-forma-muted)',
  mutedPressableClass: 'bg-(--fc-forma-muted)',

  strongBgClass: 'bg-(--fc-forma-strong)',
  mutedBgClass: 'bg-(--fc-forma-muted)',
  faintBgClass: 'bg-(--fc-forma-faint)',
  highlightClass: 'bg-(--fc-forma-highlight)',

  borderColorClass: 'border-(--fc-forma-border)',
  primaryBorderColorClass: 'border-(--fc-forma-primary)',
  strongBorderColorClass: 'border-(--fc-forma-strong-border)',
  nowBorderColorClass: 'border-(--fc-forma-primary)', // same as primary

  eventColor: 'var(--fc-forma-event)',
  eventContrastColor: '#fff', // TODO: var!
  bgEventColor: 'var(--color-green-500)', // TODO: var!
  bgEventColorClass: 'brightness-150 opacity-15',

  popoverClass: 'border border-(--fc-forma-border) bg-(--fc-forma-background) shadow-md',

  bgClass: 'bg-(--fc-forma-background)',
  bgOutlineColorClass: 'outline-(--fc-forma-background)',

  mutedFgClass: 'text-gray-700', // TODO
}

const unselectedButtonTextColorClass = 'text-(--fc-forma-tab-foreground)'
const unselectedButtonHoverBorderColorClass = 'hover:border-(--fc-forma-tab-over-border)'
const unselectedButtonHoverBgColorClass = 'hover:bg-(--fc-forma-tab-over)'
const unselectedButtonActiveBorderColorClass = 'active:border-(--fc-forma-tab-down-border)'
const unselectedButtonActiveBgColorClass = 'focus-visible:bg-(--fc-forma-tab-over) active:bg-(--fc-forma-tab-down)'
const unselectedButtonClass = `border-transparent ${unselectedButtonTextColorClass} ${unselectedButtonHoverBorderColorClass} ${unselectedButtonHoverBgColorClass} ${unselectedButtonActiveBorderColorClass} ${unselectedButtonActiveBgColorClass}`

const selectedButtonBorderColorClass = 'border-(--fc-forma-tab-selected-border)'
const selectedButtonBgColorClass = 'bg-(--fc-forma-tab-selected)'
const selectedButtonHoverBgColorClass = 'hover:bg-(--fc-forma-tab-selected-over) focus-visible:bg-(--fc-forma-tab-selected-over)'
const selectedButtonActiveBgColorClass = 'active:bg-(--fc-forma-tab-selected-down)'
const selectedButtonClass = `${selectedButtonBorderColorClass} ${selectedButtonBgColorClass} ${selectedButtonHoverBgColorClass} ${selectedButtonActiveBgColorClass}`

// can be added a-la-carte to other buttons
// TODO: refactor this into ghost-button somehow
const buttonHoverBgColorClass = 'hover:bg-(--fc-forma-muted) active:bg-(--fc-forma-strong)'
const buttonBorderColorClass = 'border-(--fc-forma-border)'
const buttonIconColorClass = 'text-(--fc-forma-secondary-icon)' // will only work for secondary!

const buttonIconClass = `size-5 ${buttonIconColorClass}` // will only work for secondary!

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
      'border text-sm py-1.5 rounded-sm',
      data.isIconOnly ? 'px-2' : 'px-3',
      data.isIconOnly
        // ghost-button
        ? `border-transparent ${buttonHoverBgColorClass}`
        : data.inSelectGroup
          ? data.isSelected
            // select-group SELECTED
            ? selectedButtonClass
            // select-group NOT-selected
            : unselectedButtonClass
          : data.isPrimary
            // primary button
            ? `${optionParams.primaryPressableClass} border-transparent`
            // secondary button
            : `${buttonBorderColorClass} ${buttonHoverBgColorClass}`,
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

    popoverCloseContent: () => svgs.dismiss('size-5 opacity-65'),
  },
  views: baseEventCalendarOptions.views,
}
