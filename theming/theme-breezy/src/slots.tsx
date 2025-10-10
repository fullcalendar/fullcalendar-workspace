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
      !data.dayNumberText ? (
        <span
          className={joinClassNames(
            `text-xs/6 ${params.fgClass}`,
            !data.isCompact && 'font-semibold',
          )}
        >{data.text}</span>
      ) : (
        // for this scenario, dayHeaderInnerClass needs 'group'
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
                      (data.isToday && !data.inPopover)
                        ? joinClassNames(
                            'w-8 rounded-full justify-center mx-0.5',
                            data.hasNavLink
                              ? params.primaryPressableGroupClass
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
  }
}
