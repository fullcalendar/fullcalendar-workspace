import { CalendarOptions } from '@fullcalendar/core'
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
          <Fragment key={i}>
            {textPart.type !== 'day' ? (
              <span className='whitespace-pre text-gray-500'>{textPart.value}</span>
            ) : (
              data.isToday ? (
                <span className={`w-[2em] h-[2em] flex flex-row items-center justify-center whitespace-pre rounded-full ${params.todayCircleBgColorClass} ${params.todayCircleTextColorClass} font-semibold`}>{textPart.value}</span>
              ) : (
                <span className='h-[2em] flex flex-row items-center justify-center whitespace-pre text-gray-500'>{textPart.value}</span>
              )
            )}
          </Fragment>
        ))}
      </Fragment>
    ),
    dayCellTopContent: (data) => (
      <Fragment>
        {data.textParts.map((textPart, i) => (
          <Fragment key={i}>
            {textPart.type !== 'day' ? (
              <span className='whitespace-pre'>{textPart.value}</span>
            ) : (
              data.isToday ? (
                <span className={`w-[2em] h-[2em] flex flex-row items-center justify-center whitespace-pre rounded-full ${params.todayCircleBgColorClass} ${params.todayCircleTextColorClass} font-semibold`}>{textPart.value}</span>
              ) : (
                <span className='h-[2em] flex flex-row items-center justify-center whitespace-pre'>{textPart.value}</span>
              )
            )}
          </Fragment>
        ))}
      </Fragment>
    ),
  }
}
