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
*/

export const optionParams: EventCalendarOptionParams = { // TODO: rename to defaultUiParams?
  // needed for today-circle and today-line and now-line
  primaryBgColorClass: 'bg-(--fc-forma-primary-color0)',
  primaryTextColorClass: 'text-(--fc-forma-primary-text-color)',
  primaryBorderColorClass: 'border-(--fc-forma-primary-color0)', // TODO: rename to compactMoreLinkBorderColorClass?

  majorBorderColorClass: 'border-(--fc-forma-strong-border)', // TODO: turn into variables!

  ghostButtonClass: 'hover:bg-gray-500/20 focus-visible:bg-gray-500/30',
  selectedBgClass: 'bg-gray-500/40', // selected "event"
  highlightClass: 'bg-(--fc-forma-highlight-color)',

  transparentMutedBgClass: 'bg-gray-500/10',
  mutedBgClass: 'bg-(--fc-forma-muted)',
  neutralBgClass: 'bg-(--fc-forma-strong)', // TODO: rename prop

  borderColorClass: 'border-(--fc-forma-border)',
  nowIndicatorBorderColorClass: 'border-(--fc-forma-primary-color0)', // same as primary

  eventColor: 'var(--fc-forma-event-color)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'brightness-150 opacity-15',

  popoverClass: 'border border-(--fc-forma-border) bg-(--fc-forma-canvas-color) shadow-md',

  bgColorClass: 'bg-(--fc-forma-canvas-color)',
  bgColorOutlineClass: 'outline-(--fc-forma-canvas-color)',
}

const primaryOtherBgColorClass = 'hover:bg-(--fc-forma-primary-color1) active:bg-(--fc-forma-primary-color2) focus-visible:bg-(--fc-forma-primary-color2)'

const unselectedButtonTextColorClass = 'text-(--fc-forma-muted-text-color)'
const unselectedButtonHoverBorderColorClass = 'hover:border-(--fc-forma-tab-hover-border)'
const unselectedButtonHoverBgColorClass = 'hover:bg-(--fc-forma-tab-hover)'
const unselectedButtonActiveBorderColorClass = 'active:border-(--fc-forma-tab-active-border)'
const unselectedButtonActiveBgColorClass = 'focus-visible:bg-(--fc-forma-tab-hover) active:bg-(--fc-forma-tab-down)'
const unselectedButtonClass = `border-transparent ${unselectedButtonTextColorClass} ${unselectedButtonHoverBorderColorClass} ${unselectedButtonHoverBgColorClass} ${unselectedButtonActiveBorderColorClass} ${unselectedButtonActiveBgColorClass}`

const selectedButtonBorderColorClass = 'border-(--fc-forma-tab-selected-border)'
const selectedButtonBgColorClass = 'bg-(--fc-forma-tab-selected)'
const selectedButtonHoverBgColorClass = 'hover:bg-(--fc-forma-tab-selected-hover) focus-visible:bg-(--fc-forma-tab-selected-hover)'
const selectedButtonActiveBgColorClass = 'active:bg-(--fc-forma-tab-selected-down)'
const selectedButtonClass = `${selectedButtonBorderColorClass} ${selectedButtonBgColorClass} ${selectedButtonHoverBgColorClass} ${selectedButtonActiveBgColorClass}`

// can be added a-la-carte to other buttons
const buttonHoverBgColorClass = 'hover:bg-(--fc-forma-glassy) active:bg-(--fc-forma-cloudy)'
const buttonBorderColorClass = 'border-(--fc-forma-secondary-border) hover:border-(--fc-forma-secondary-border) active:border-(--fc-forma-secondary-border) focus-visible:border-(--fc-forma-secondary-border)'
const buttonIconColorClass = 'text-(--fc-forma-icon-color)'

const buttonIconClass = `size-5 ${buttonIconColorClass}`

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    className: `${optionParams.bgColorClass} border ${optionParams.borderColorClass} rounded-sm shadow-xs overflow-hidden`,
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
            ? `${optionParams.primaryBgColorClass} border-transparent ${optionParams.primaryTextColorClass} ${primaryOtherBgColorClass}`
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
