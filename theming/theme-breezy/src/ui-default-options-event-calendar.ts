import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgs from './ui-default-svgs.js'

const buttonIconClass = 'size-5 text-gray-400' // best? to sync to line-height???

// button color reference: https://catalyst.tailwindui.com/docs/button

export const optionParams: EventCalendarOptionParams = { // TODO: rename to defaultUiParams?
  primaryBgColorClass: 'bg-(--fc-breezy-primary-color)',
  primaryTextColorClass: 'text-(--fc-breezy-primary-text-color)',
  primaryBorderColorClass: 'border-(--fc-breezy-primary-color)',

  eventColor: 'var(--fc-breezy-event-color)',
  backgroundEventColor: 'var(--color-green-500)',
  backgroundEventColorClass: 'brightness-150 opacity-15',

  popoverClass: 'border border-gray-300 shadow-md bg-white rounded-lg',

  pageBgColorClass: 'bg-(--fc-breezy-canvas-color)',
  pageBgColorOutlineClass: 'outline-(--fc-breezy-canvas-color)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export const defaultUiEventCalendarOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseEventCalendarOptions.optionDefaults,

    toolbarClass: 'px-4 py-4 items-center bg-gray-50 gap-4',
    toolbarSectionClass: 'items-center gap-4',
    toolbarTitleClass: 'text-lg font-semibold text-gray-900',

    /*
    TODO: don't make buttons so fat
    are buttons 1px taller than in Tailwind Plus because we're not using inset border?
    */
    buttonGroupClass: (data) => [
      !data.isSelectGroup && 'rounded-md shadow-xs border border-gray-300'
    ],
    buttonClass: (data) => [
      'py-2 text-sm focus:relative',
      data.isIconOnly ? 'px-2' : 'px-3',
      data.inSelectGroup ? (
        'rounded-md font-medium text-gray-600 hover:text-gray-800 ' +
        (data.isSelected
          ? 'bg-gray-200'
          : '')
        //
        // Colored version:
        // 'rounded-md font-medium hover:text-gray-800 ' +
        // (data.isSelected
        //   ? 'bg-indigo-100 text-indigo-700'
        //   : 'text-gray-600')
      ) : (
        'font-semibold ' +
        (data.isPrimary
          ? `${optionParams.primaryBgColorClass} ${optionParams.primaryTextColorClass} shadow-xs` // why shadow here?
          : 'bg-white hover:bg-gray-50 text-gray-900'
        ) + ' ' +
        (data.inGroup
          ? 'first:rounded-s-md last:rounded-e-md'
          : 'rounded-md shadow-xs border ' +
            (data.isPrimary ? optionParams.primaryBorderColorClass : 'border-gray-300')) // weird border setup for primary
      ),
    ],

    buttons: {
      prev: {
        iconContent: (data) => svgs.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? '-rotate-90' : 'rotate-90',
          ),
        ),
      },
      next: {
        iconContent: (data) => svgs.chevronDown(
          joinClassNames(
            buttonIconClass,
            data.direction === 'rtl' ? 'rotate-90' : '-rotate-90',
          ),
        ),
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

    popoverCloseContent: () => svgs.x('size-5'),
  },
  views: baseEventCalendarOptions.views,
}
