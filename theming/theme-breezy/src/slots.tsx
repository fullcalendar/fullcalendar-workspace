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
          // TODO: single-part headers (like daygrid) should have params.textHighColorClass !!!
          <Fragment key={i}>
            {textPart.type !== 'day' ? (
              <span className={`text-sm/6 whitespace-pre ${params.textMidColorClass}`}>{textPart.value}</span>
            ) : (
              data.isToday ? (
                <span className={`font-semibold text-sm/6 w-8 h-8 whitespace-pre rounded-full ${params.primaryBgColorClass} text-white flex flex-row items-center justify-center ms-1`}>{textPart.value}</span>
              ) : (
                <span className={`font-semibold text-sm/6 h-8 whitespace-pre flex flex-row items-center ${params.textHeaderColorClass}`}>{textPart.value}</span>
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
                // should use semibold?
                <span className={`h-[2em] flex flex-row items-center justify-center whitespace-pre`}>{textPart.value}</span>
              )
            )}
          </Fragment>
        ))}
      </Fragment>
    ),
  }
}
