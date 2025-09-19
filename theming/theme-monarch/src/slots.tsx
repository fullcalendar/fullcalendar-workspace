import { CalendarOptions, joinClassNames } from '@fullcalendar/core'
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
          <div
            className={joinClassNames(
              'uppercase text-xs opacity-60',
              data.hasNavLink && 'group-hover:opacity-90',
            )}
          >{data.weekdayText}</div>
        )}
        {data.dayNumberText && (
          <div
            className={joinClassNames(
              'm-0.5 flex flex-row items-center justify-center text-lg h-9',
              data.isToday
                ? `w-9 rounded-full ${params.todayPillClass({ hasNavLink: data.hasNavLink })}`
                : data.hasNavLink && `w-9 rounded-full ${transparentPressableClass}`
            )}
          >{data.dayNumberText}</div>
        )}
      </Fragment>
    ),

    listDayHeaderContent:
      (data) => !data.level ? ( // primary
        <Fragment>
          {data.textParts.map((textPart, i) => (
            <div
              key={i}
              className={
                textPart.type !== 'day'
                  ? 'whitespace-pre'
                  : joinClassNames(
                      'flex flex-row items-center justify-center size-9 rounded-full',
                      data.isToday
                        ? params.todayPillClass({ hasNavLink: data.hasNavLink })
                        : data.hasNavLink && transparentPressableClass
                    )
              }
            >{textPart.value}</div>
          ))}
        </Fragment>
      ) : (
        data.text // secondary
      )
  }
}
