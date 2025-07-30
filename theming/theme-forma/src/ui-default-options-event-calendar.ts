import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams, neutralBgClass } from './options-event-calendar.js'
import * as svgIcons from './ui-default-svgs.js'

const buttonIconClass = 'text-[1.5em] w-[1em] h-[1em]'

export const optionParams: EventCalendarOptionParams = { // TODO: rename to defaultUiParams?
  primaryBgColorClass: 'bg-(--fc-forma-primary-color)',
  primaryTextColorClass: 'text-(--fc-forma-primary-text-color)',
  primaryBorderColorClass: 'border-(--fc-forma-primary-color)',

  borderColorClass: 'border-[#ddd] dark:border-gray-800',
  majorBorderColorClass: 'border-gray-400 dark:border-gray-700',
  alertBorderColorClass: 'border-(--fc-forma-primary-color)', // same as primary

  eventColor: 'var(--fc-forma-event-color)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'brightness-150 opacity-15',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    toolbarClass: 'p-3 items-center gap-3', // TODO: document how we do NOT need to justify-between or flex-row
    toolbarSectionClass: (data) => [
      'items-center gap-3',
      data.name === 'center' && '-order-1 sm:order-0 w-full sm:w-auto', // nicer wrapping
    ],
    toolbarTitleClass: 'text-lg md:text-xl',

    buttons: {
      prev: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronLeft(buttonIconClass)
          : svgIcons.chevronRight(buttonIconClass),
      },
      next: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronRight(buttonIconClass)
          : svgIcons.chevronLeft(buttonIconClass),
      },
      prevYear: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronsLeft(buttonIconClass)
          : svgIcons.chevronsRight(buttonIconClass),
      },
      nextYear: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronsRight(buttonIconClass)
          : svgIcons.chevronsLeft(buttonIconClass),
      },
    },

    buttonGroupClass: 'items-center isolate',
    buttonClass: (data) => [
      'border text-sm py-1.5 rounded-sm',
      data.isIconOnly ? 'px-2' : 'px-3',
      data.isIconOnly
        ? 'border-transparent hover:border-gray-100 hover:bg-gray-100'
        : data.inViewGroup
          ? data.isSelected
            ? 'border-gray-400 bg-gray-100'
            : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
          : data.isPrimary
            ? `${optionParams.primaryBgColorClass} ${optionParams.primaryBorderColorClass} text-white` // weird border
              // TODO: do hover effect. Fluent does inner dark shadow
            : 'border-gray-300',
          // TODO: disabled
          // TODO: dark mode
    ],

    // TODO: fix problem with huge hit area for title
    popoverClass: `border ${optionParams.borderColorClass} bg-(--fc-canvas-color) shadow-md`,
    popoverHeaderClass: neutralBgClass,
    popoverCloseClass: 'absolute top-2 end-2',
    popoverCloseContent: () => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65'),
    popoverBodyClass: 'p-2 min-w-[220px]',
  },
  views: baseEventCalendarOptions.views,
}
