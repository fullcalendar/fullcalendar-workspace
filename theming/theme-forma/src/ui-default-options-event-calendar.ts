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

export const optionParams: EventCalendarOptionParams = { // TODO: rename to defaultUiParams?
  // needed for today-circle and today-line and now-line
  primaryBgColorClass: 'bg-(--fc-forma-primary-color0)',
  primaryTextColorClass: 'text-(--fc-forma-primary-text-color)',
  primaryBorderColorClass: 'border-(--fc-forma-primary-color0)', // TODO: rename to compactMoreLinkBorderColorClass?

  majorBorderColorClass: 'border-(--fc-forma-border3)', // TODO: turn into variables!

  solidMoreLinkBgClass: 'bg-(--fc-forma-bg6)', // TODO: pressability!
  ghostButtonClass: 'hover:bg-gray-500/20 focus-visible:bg-gray-500/30',
  selectedBgClass: 'bg-gray-500/40', // selected "event"
  highlightClass: 'bg-(--fc-forma-highlight-color)',

  transparentMutedBgClass: 'bg-gray-500/10',
  mutedBgClass: 'bg-(--fc-forma-bg0)',

  borderColorClass: 'border-(--fc-forma-border1)',
  nowIndicatorBorderColorClass: 'border-(--fc-forma-primary-color0)', // same as primary

  eventColor: 'var(--fc-forma-event-color)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'brightness-150 opacity-15',

  popoverClass: 'border border-(--fc-forma-border1) bg-(--fc-forma-canvas-color) shadow-md',

  bgColorClass: 'bg-(--fc-forma-canvas-color)',
  bgColorOutlineClass: 'outline-(--fc-forma-canvas-color)',
}

const primaryOtherBgColorClass = 'hover:bg-(--fc-forma-primary-color1) active:bg-(--fc-forma-primary-color2) focus-visible:bg-(--fc-forma-primary-color2)'

const unselectedButtonTextColorClass = 'text-(--fc-forma-muted-text-color)'
const unselectedButtonHoverBorderColorClass = 'hover:border-(--fc-forma-border0)'
const unselectedButtonHoverBgColorClass = 'hover:bg-(--fc-forma-bg0)'
const unselectedButtonActiveBorderColorClass = 'active:border-(--fc-forma-border1)'
const unselectedButtonActiveBgColorClass = 'active:bg-(--fc-forma-bg4) focus-visible:bg-(--fc-forma-bg4)'
const unselectedButtonClass = `border-transparent ${unselectedButtonTextColorClass} ${unselectedButtonHoverBorderColorClass} ${unselectedButtonHoverBgColorClass} ${unselectedButtonActiveBorderColorClass} ${unselectedButtonActiveBgColorClass}`

const selectedButtonBorderColorClass = 'border-(--fc-forma-border3)'
const selectedButtonBgColorClass = 'bg-(--fc-forma-bg1)'
const selectedButtonHoverBgColorClass = 'hover:bg-(--fc-forma-bg2)'
const selectedButtonActiveBgColorClass = 'active:bg-(--fc-forma-bg3) focus-visible:bg-(--fc-forma-bg3)'
const selectedButtonClass = `${selectedButtonBorderColorClass} ${selectedButtonBgColorClass} ${selectedButtonHoverBgColorClass} ${selectedButtonActiveBgColorClass}`

// can be added a-la-carte to other buttons
const buttonHoverBgColorClass = 'hover:bg-(--fc-forma-bg3) active:bg-(--fc-forma-bg5)'
const buttonBorderColorClass = 'border-(--fc-forma-bg5) hover:border-(--fc-forma-border1) active:border-(--fc-forma-border1) focus-visible:border-(--fc-forma-border1)'
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

    buttons: {
      prev: {
        iconContent: (data) => svgs.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? '-rotate-90' : 'rotate-90',
          )
        )
      },
      next: {
        iconContent: (data) => svgs.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? 'rotate-90' : '-rotate-90',
          )
        )
      },
      prevYear: {
        iconContent: (data) => svgs.chevronDoubleLeft(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' && 'rotate-180',
          )
        )
      },
      nextYear: {
        iconContent: (data) => svgs.chevronDoubleLeft(
          joinClassNames(
            buttonIconClass,
            data.direction !== 'rtl' && 'rotate-180',
          )
        )
      },
    },

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

    popoverCloseContent: () => svgs.dismiss('size-5 opacity-65'),
  },
  views: baseEventCalendarOptions.views,
}
