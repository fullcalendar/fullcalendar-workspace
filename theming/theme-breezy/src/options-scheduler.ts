import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { EventCalendarOptionParams } from './options-event-calendar.js'

// ambient types
// TODO: make these all peer deps? or wait, move options to just core
import '@fullcalendar/timeline'
import '@fullcalendar/resource-daygrid'
import '@fullcalendar/resource-timegrid'
import '@fullcalendar/resource-timeline'
import '@fullcalendar/adaptive'
import '@fullcalendar/scrollgrid'

export function createSchedulerOnlyOptions({}: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  return {
    optionDefaults: {
      resourceAreaDividerClass: 'border-l border-gray-300',

      resourceAreaHeaderRowClass: 'border border-gray-200',
      resourceAreaHeaderClass: 'border border-gray-100',
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaRowClass: 'border border-gray-200',
      resourceCellClass: 'border border-gray-100',
      resourceCellInnerClass: 'p-2 text-sm',

      resourceGroupHeaderClass: 'bg-gray-50',
      resourceGroupHeaderInnerClass: 'p-2 text-sm',

      resourceGroupLaneClass: 'border border-gray-200 bg-gray-50',
      resourceLaneClass: 'border border-gray-200',
      // resourceLaneTopClass: 'h-0.5',
      // resourceLaneBottomClass: 'h-1', // fix BUG, why this need to be so thick?

      resourceExpanderClass: 'self-center',
    },
    views: {
      timeline: {
        slotLabelDividerClass: 'border-t border-gray-300',

        slotLabelAlign: 'center',
        slotLabelClass: 'justify-end',
        slotLabelInnerClass: '-ms-1 pe-6 py-2',
        //^^^wait, we don't want do this this for upper-level slot labels

        rowEventClass: 'mb-px',
      },
    },
  }
}
