import { CalendarOptions, joinClassNames } from '@fullcalendar/core'
import type * as FullCalendarPreact from '@fullcalendar/core/preact'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { EventCalendarOptionParams, xxsTextClass } from './options-event-calendar.js'

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
      !data.dayNumberText ? (
        <span className={`text-xs/6 font-semibold ${params.textHighColorClass}`}>{data.text}</span>
      ) : (
        <Fragment>
          {data.textParts.map((textPart, i) => (
            <span
              key={i}
              className={joinClassNames(
                'whitespace-pre',
                data.isCompact ? 'text-xs' : 'text-sm/6',
                textPart.type === 'day'
                  ? joinClassNames(
                      'h-8 font-semibold flex flex-row items-center', // v-align-text
                      data.isToday && !data.inPopover
                        ? `w-8 rounded-full justify-center mx-1 ${params.primaryBgColorClass} ${params.primaryTextColorClass}`
                        : params.textHeaderColorClass
                    )
                  : params.textMidColorClass,
              )}
            >{textPart.value}</span>
          ))}
        </Fragment>
      )
    ),
    dayCellTopContent: (data) => (
      <Fragment>
        {data.textParts.map((textPart, i) => (
          <span
            key={i}
            className={joinClassNames(
              'whitespace-pre',
              data.isCompact ? xxsTextClass : 'text-xs/6',
              textPart.type === 'day'
                ? joinClassNames(
                    'h-6 flex flex-row items-center', // v-align-text
                    data.isToday
                      ? `w-6 rounded-full justify-center font-semibold ${params.primaryBgColorClass} ${params.primaryTextColorClass}`
                      : params.textMidColorClass
                  )
                : params.textMidColorClass
            )}
          >{textPart.value}</span>
        ))}
      </Fragment>
    ),
  }
}
