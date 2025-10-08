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
        {data.weekdayText && (
          <div
            className={joinClassNames(
              'uppercase text-xs',
              params.mutedFgClass,
            )}
          >{data.weekdayText}</div>
        )}
        {data.dayNumberText && (
          <div
            className={joinClassNames(
              'm-0.5 flex flex-row items-center justify-center text-lg h-9',
              data.isToday
                ? joinClassNames('w-9 rounded-full', data.hasNavLink ? params.tertiaryPressableGroupClass : params.tertiaryClass)
                : data.hasNavLink && `w-9 rounded-full ${params.ghostPressableGroupClass}`
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
                        ? (data.hasNavLink ? params.tertiaryPressableGroupClass : params.tertiaryClass)
                        : (data.hasNavLink && params.ghostPressableGroupClass)
                    )
              }
            >{textPart.value}</div>
          ))}
        </Fragment>
      ) : ( // secondary
        data.text
      )
  }
}
