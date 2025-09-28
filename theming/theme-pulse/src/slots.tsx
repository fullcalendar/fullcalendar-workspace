import { CalendarOptions, joinClassNames } from '@fullcalendar/core'
import type * as FullCalendarPreact from '@fullcalendar/core/preact'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { EventCalendarOptionParams } from './options-event-calendar.js'

// HACK
;(createElement || Fragment); // import intentionally unused

export interface createSlotsVDom {
  createElement: typeof FullCalendarPreact.createElement
  Fragment: typeof FullCalendarPreact.Fragment
}

export function createSlots(
  { createElement, Fragment }: createSlotsVDom, // masks the module-wide imports
  params: EventCalendarOptionParams,
): CalendarOptions {
  return {
    dayHeaderContent: (data) => (
      <Fragment>
        {data.textParts.map((textPart, i) => (
          <span
            key={i}
            className={joinClassNames(
              'whitespace-pre text-sm',
              textPart.type === 'day'
                ? joinClassNames(
                    'h-7 flex flex-row items-center', // v-align-text
                    data.isToday
                      ? `w-7 mx-0.5 rounded-full ${params.todayCircleBgClass} ${params.todayCircleFgClass} font-semibold justify-center` // h-align-text
                      : params.mutedFgClass,
                  )
                : params.mutedFgClass,
            )}
          >{textPart.value}</span>
        ))}
      </Fragment>
    ),
    dayCellTopContent: (data) => ( // TODO: DRY with dayHeaderContent?
      <Fragment>
        {data.textParts.map((textPart, i) => (
          <span
            key={i}
            className={joinClassNames(
              'whitespace-pre text-sm',
              textPart.type === 'day'
                ? joinClassNames(
                    'h-6 flex flex-row items-center', // v-align-text
                    data.isToday
                      ? `w-6 rounded-full ${params.todayCircleBgClass} ${params.todayCircleFgClass} font-semibold justify-center` // h-align-text
                      : params.mutedFgClass,
                  )
                : params.mutedFgClass,
            )}
          >{textPart.value}</span>
        ))}
      </Fragment>
    ),
  }
}
