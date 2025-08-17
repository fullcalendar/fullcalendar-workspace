import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgIcons from './ui-default-svgs.js'

const buttonIconClass = 'text-[1.5em] w-[1em] h-[1em]'

export const optionParams: EventCalendarOptionParams = { // TODO: rename to defaultUiParams?
  primaryBgColorClass: 'bg-(--fc-forma-primary-color)',
  primaryTextColorClass: 'text-(--fc-forma-primary-text-color)',
  primaryBorderColorClass: 'border-(--fc-forma-primary-color)',

  borderColorClass: 'border-[#ddd] dark:border-gray-800',
  nowIndicatorBorderColorClass: 'border-(--fc-forma-primary-color)', // same as primary

  eventColor: 'var(--fc-forma-event-color)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'brightness-150 opacity-15',

  popoverClass: 'border border-[#ddd] dark:border-gray-800 bg-(--fc-forma-canvas-color) shadow-md',

  pageBgColorClass: 'bg-(--fc-forma-canvas-color)',
  pageBgColorOutlineClass: 'outline-(--fc-forma-canvas-color)',
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
        iconContent: (data) => svgIcons.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? '-rotate-90' : 'rotate-90',
          )
        )
      },
      next: {
        iconContent: (data) => svgIcons.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? 'rotate-90' : '-rotate-90',
          )
        )
      },
      prevYear: {
        iconContent: (data) => svgIcons.chevronDoubleLeft(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' && 'rotate-180',
          )
        )
      },
      nextYear: {
        iconContent: (data) => svgIcons.chevronDoubleLeft(
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
        ? 'border-transparent hover:border-gray-100 hover:bg-gray-100'
        : data.inSelectGroup
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

    popoverCloseContent: () => svgIcons.dismiss('w-[1.357em] h-[1.357em] opacity-65'),
  },
  views: baseEventCalendarOptions.views,
}
