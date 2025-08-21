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
        {data.isToday && (
          // contained by either dayHeaderClass or dayHeaderInnerClass
          <div className={`absolute top-0 left-0 right-0 border-t-4 ${params.primaryBorderColorClass} pointer-events-none`} />
        )}
        {data.dayNumberText && (
          <div
            className={joinClassNames(
              'text-lg',
              data.isToday && 'font-bold',
            )}
          >{data.dayNumberText}</div>
        )}
        {data.weekdayText && (
          <div className='text-xs'>{data.weekdayText}</div>
        )}
      </Fragment>
    ),

    dayCellTopContent: (data) => (
      !data.isToday
        ? <span className='px-1 h-[1.8em] whitespace-pre flex flex-row items-center'>{data.text}</span>
        : (
          <Fragment>
            {data.textParts.map((textPart, i) => (
              <span
                key={i}
                className={joinClassNames(
                  'h-[1.8em] whitespace-pre flex flex-row items-center',
                  textPart.type === 'day' &&
                    `w-[1.8em] justify-center rounded-full ${params.primaryBgColorClass} ${params.primaryTextColorClass}`
                )}
              >{textPart.value}</span>
            ))}
          </Fragment>
        )
    ),
  }
}
