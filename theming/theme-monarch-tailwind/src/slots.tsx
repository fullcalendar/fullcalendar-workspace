import { CalendarOptions, joinClassNames } from '@fullcalendar/react'
import { Fragment } from 'react'
import { EventCalendarOptionParams } from './options-event-calendar'

export function createSlots(
  params: EventCalendarOptionParams,
): CalendarOptions {
  return {

    /* Day Header
    --------------------------------------------------------------------------------------------- */

    dayHeaderContent: (data) => (
      <Fragment>
        {data.weekdayText && (
          <div
            className={joinClassNames(
              'text-xs uppercase',
              params.mutedFgClass,
            )}
          >{data.weekdayText}</div>
        )}
        {data.dayNumberText && (
          <div
            className={joinClassNames(
              'm-0.5 rounded-full flex flex-row items-center justify-center',
              data.isNarrow
                ? 'size-7 text-base'
                : 'size-8 text-lg',
              data.isToday
                ? (data.hasNavLink ? params.tertiaryPressableGroupClass : params.tertiaryClass)
                : (data.hasNavLink && params.mutedHoverPressableGroupClass),
              data.hasNavLink && joinClassNames(
                params.outlineWidthGroupFocusClass,
                params.tertiaryOutlineColorClass,
              ),
            )}
          >{data.dayNumberText}</div>
        )}
      </Fragment>
    ),
  }
}
