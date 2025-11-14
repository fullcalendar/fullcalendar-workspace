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
      (!data.dayNumberText && !data.inPopover) ? (
        // small uniform text
        // NOTE: Fragment used to avoid Preact diffing problem
        <Fragment>{data.text}</Fragment>
      ) : (
        // normal-sized varying-color text (needs 'group')
        <Fragment>
          {data.textParts.map((textPart, i) => (
            <span
              key={i}
              className={joinClassNames(
                'whitespace-pre',
                data.isNarrow ? 'text-xs' : 'text-sm',
                textPart.type === 'day'
                  ? joinClassNames(
                      'flex flex-row items-center', // v-align-text
                      !data.isNarrow && 'font-semibold',
                      (data.isToday && !data.inPopover)
                        ? joinClassNames(
                            'rounded-full justify-center mx-0.5',
                            data.isNarrow ? 'size-6' : 'size-8',
                            data.hasNavLink
                              ? joinClassNames(
                                  params.primaryPressableGroupClass,
                                  params.outlineWidthGroupFocusClass,
                                  params.outlineOffsetClass,
                                  params.primaryOutlineColorClass,
                                )
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
