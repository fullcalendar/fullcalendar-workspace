import { CalendarOptions, joinClassNames } from '@fullcalendar/react'
import { Fragment } from 'react'
import { EventCalendarOptionParams } from './options-event-calendar'

export function createSlots(
  params: EventCalendarOptionParams,
): CalendarOptions {
  return {

    /* Day Header
    --------------------------------------------------------------------------------------------- */

    dayHeaderContent: (info) => (
      (!info.dayNumberText && !info.inPopover) ? (
        // small uniform text
        // NOTE: Fragment used to avoid Preact diffing problem
        <Fragment>{info.text}</Fragment>
      ) : (
        // normal-sized varying-color text (needs 'group')
        <Fragment>
          {info.textParts.map((textPart, i) => (
            <span
              key={i}
              className={joinClassNames(
                'whitespace-pre',
                info.isNarrow ? 'text-xs' : 'text-sm',
                textPart.type === 'day'
                  ? joinClassNames(
                      'flex flex-row items-center', // v-align
                      !info.isNarrow && 'font-semibold',
                      (info.isToday && !info.inPopover)
                        // day-number circle
                        ? joinClassNames(
                            'mx-0.5 rounded-full justify-center',
                            info.isNarrow ? 'size-6' : 'size-8',
                            info.hasNavLink
                              ? joinClassNames(
                                  params.primaryPressableGroupClass,
                                  params.outlineWidthGroupFocusClass,
                                  params.outlineOffsetClass,
                                  params.primaryOutlineColorClass,
                                )
                              : params.primaryClass,
                          )
                        // day-number emphasized text
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
