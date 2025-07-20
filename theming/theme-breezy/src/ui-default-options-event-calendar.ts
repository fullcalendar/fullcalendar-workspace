import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { createEventCalendarOptions, EventCalendarOptionParams } from './options-event-calendar.js'
import * as svgIcons from './ui-default-svgs.js'

const buttonIconClass = 'size-5 text-gray-400' // best? to sync to line-height???

// TODO: DRY
// palette vars
// TODO: default-bg-event-color and highlight color
// button color reference: https://catalyst.tailwindui.com/docs/button
const activeBgColorClass = 'bg-(--fc-breezy-active-color)'
const activeBorderColorClass = 'border-(--fc-breezy-active-color)'

export const optionParams: EventCalendarOptionParams = { // TODO: rename to defaultUiParams?
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

    popoverClass: 'border border-gray-300 shadow-md bg-white rounded-lg m-1',
    popoverBodyClass: 'p-2 min-w-50',

    /*
    TODO: don't make buttons so fat
    are buttons 1px taller than in Tailwind Plus because we're not using inset border?
    */
    buttonGroupClass: (data) => [
      !data.isViewGroup && 'rounded-md shadow-xs border border-gray-300'
    ],
    buttonClass: (data) => [
      'py-2 text-sm focus:relative',
      data.isIconOnly ? 'px-2' : 'px-3',
      data.inViewGroup ? (
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
          ? `${activeBgColorClass} text-white shadow-xs` // why shadow here?
          : 'bg-white hover:bg-gray-50 text-gray-900'
        ) + ' ' +
        (data.inGroup
          ? 'first:rounded-s-md last:rounded-e-md'
          : 'rounded-md shadow-xs border ' +
            (data.isPrimary ? activeBorderColorClass : 'border-gray-300')) // weird border setup for primary
      ),
    ],

    buttons: {
      prev: {
        // TODO: do RTL
        iconContent: () => svgIcons.chevronLeft(buttonIconClass),
      },
      next: {
        iconContent: () => svgIcons.chevronRight(buttonIconClass),
      }
    },
  },
  views: baseEventCalendarOptions.views,
}
