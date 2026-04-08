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
      <Fragment>
        {info.weekdayText && (
          <div
            className={joinClassNames(
              'text-xs uppercase',
              params.mutedFgClass,
            )}
          >{info.weekdayText}</div>
        )}
        {info.dayNumberText && (
          <div
            className={joinClassNames(
              'm-0.5 rounded-full flex flex-row items-center justify-center',
              info.isNarrow
                ? 'size-7 text-base'
                : 'size-8 text-lg',
              info.isToday
                ? (info.hasNavLink ? params.tertiaryPressableGroupClass : params.tertiaryClass)
                : (info.hasNavLink && params.mutedHoverPressableGroupClass),
              info.hasNavLink && joinClassNames(
                params.outlineWidthGroupFocusClass,
                params.tertiaryOutlineColorClass,
              ),
            )}
          >{info.dayNumberText}</div>
        )}
      </Fragment>
    ),
  }
}
