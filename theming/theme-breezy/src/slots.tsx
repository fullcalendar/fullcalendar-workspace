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
              <span className='whitespace-pre'>{textPart.value}</span>
            ) : (
              data.isToday ? (
                <span className={`font-semibold w-8 h-8 whitespace-pre rounded-full ${params.primaryBgColorClass} text-white flex flex-row items-center justify-center ms-1`}>{textPart.value}</span>
              ) : (
                <span className='font-semibold h-8 whitespace-pre flex flex-row items-center'>{textPart.value}</span>
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
                <span className={`w-[2em] h-[2em] flex flex-row items-center justify-center whitespace-pre rounded-full ${params.primaryBgColorClass} ${params.primaryTextColorClass} font-semibold`}>{textPart.value}</span>
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
