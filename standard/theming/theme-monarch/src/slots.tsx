import { CalendarOptions } from '@fullcalendar/core'
import type * as FullCalendarPreact from '@fullcalendar/core/preact'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { EventCalendarOptionParams, transparentPressableClass } from './options-event-calendar.js'

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
        {data.weekdayText && (
          <div className={
            'uppercase text-xs opacity-60' +
              (data.hasNavLink ? ' group-hover:opacity-90' : '')
          }>{data.weekdayText}</div>
        )}
        {data.dayNumberText && (
          <div
            className={
              'm-0.5 flex flex-row items-center justify-center text-lg h-[2em]' +
              (data.isToday
                ? ` w-[2em] rounded-full ${params.todayPillClass({ hasNavLink: data.hasNavLink })}`
                : data.hasNavLink
                  ? ` w-[2em] rounded-full ${transparentPressableClass}`
                  : '')
            }
          >{data.dayNumberText}</div>
        )}
      </Fragment>
    ),

    listDayHeaderContent:
      (data) => !data.level ? (
        <Fragment>
          {data.textParts.map((textPart) => ( // primary
            textPart.type === 'day' ? (
              <div className={
                'flex flex-row items-center justify-center w-[2em] h-[2em] rounded-full' +
                  (data.isToday
                    ? (' ' + params.todayPillClass({ hasNavLink: data.hasNavLink }))
                    : (' ' + (data.hasNavLink ? transparentPressableClass : '')))
              }>{textPart.value}</div>
            ) : (
              <div className='whitespace-pre'>{textPart.value}</div>
            )
          ))}
        </Fragment>
      ) : (
        data.text // secondary
      )
  }
}
