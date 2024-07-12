import {
  DateComponent,
  DateMarker,
  DateProfile,
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { DateHeaderCells } from './DateHeaderCells.js'
import { DayOfWeekHeaderCells } from './DayOfWeekHeaderCells.js'

export interface DayGridHeaderProps {
  dates: DateMarker[]
  dateProfile: DateProfile
  datesRepDistinctDays: boolean
  colWidth?: number
}

export class DayGridHeader extends DateComponent<DayGridHeaderProps> {
  render() {
    const { props } = this

    return (
      <div class='fc-newnew-row'>
        {props.datesRepDistinctDays ? (
          <DateHeaderCells
            cells={props.dates.map((date) => ({ date })) /* TODO: memoize */}
            dateProfile={props.dateProfile}
            colWidth={props.colWidth}
          />
        ) : (
          <DayOfWeekHeaderCells
            cells={props.dates.map((date) => ({ dow: date.getUTCDay() })) /* TODO: memoize */}
            dateProfile={props.dateProfile}
            colWidth={props.colWidth}
          />
        )}
    </div>
    )
  }
}
