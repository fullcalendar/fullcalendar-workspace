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
        <span
          className={joinClassNames(
            `text-xs/6 ${params.fgClass}`,
            !data.isCompact && 'font-semibold',
          )}
        >{data.text}</span>
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
                      'h-8 flex flex-row items-center', // v-align-text
                      !data.isCompact && 'font-semibold',
                      data.isToday && !data.inPopover
                        ? joinClassNames(
                            'w-8 rounded-full justify-center mx-0.5',
                            data.hasNavLink
                              ? params.primaryPressableClass
                              : params.primaryClass,
                          )
                        : params.strongFgClass
                    )
                  : params.mutedFgClass,
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
                      ? joinClassNames(
                          `w-6 rounded-full justify-center font-semibold`,
                          data.hasNavLink
                            ? params.primaryPressableClass
                            : params.primaryClass,
                        )
                      : params.mutedFgClass
                  )
                : params.mutedFgClass
            )}
          >{textPart.value}</span>
        ))}
      </Fragment>
    ),
  }
}
