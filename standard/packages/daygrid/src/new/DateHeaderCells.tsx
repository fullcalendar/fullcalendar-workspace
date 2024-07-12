import {
  BaseComponent,
  DateMarker,
  memoize,
  DateProfile,
  NowTimer,
  DateRange,
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { createDayHeaderFormatter } from './util.js'
import { DateHeaderCell, DateHeaderCellModel } from './DateHeaderCell.js'

export interface DateHeaderCellsProps {
  cells: DateHeaderCellModel[]
  dateProfile: DateProfile
  colSpan?: number
  colWidth: number | undefined
  isSticky?: boolean
}

/*
NOTE: this is DOOMED because of renderHeaderContent()
*/
export class DateHeaderCells extends BaseComponent<DateHeaderCellsProps> {
  createDayHeaderFormatter = memoize(createDayHeaderFormatter)

  render() {
    let { context } = this
    let { cells, dateProfile } = this.props

    let dayHeaderFormat = this.createDayHeaderFormatter(
      context.options.dayHeaderFormat,
      true, // datesRepDistinctDays
      cells.length,
    )

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => (
          cells.map((cell) => (
            <DateHeaderCell
              key={cell.date.toISOString()}
              cell={cell}
              navLink={cells.length > 1}
              dateProfile={dateProfile}
              todayRange={todayRange}
              dayHeaderFormat={dayHeaderFormat}
              colSpan={this.props.colSpan}
              colWidth={this.props.colWidth}
              isSticky={this.props.isSticky}
            />
          ))
        )}
      </NowTimer>
    )
  }
}
