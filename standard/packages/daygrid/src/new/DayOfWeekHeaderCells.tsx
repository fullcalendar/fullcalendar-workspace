import {
  BaseComponent,
  memoize,
  DateProfile,
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { DayOfWeekHeaderCell, DayOfWeekHeaderCellModel } from './DayOfWeekHeaderCell.js'
import { createDayHeaderFormatter } from './util.js'

export interface DayOfWeekHeaderCellsProps {
  cells: DayOfWeekHeaderCellModel[]
  dateProfile: DateProfile
  colSpan?: number
  colWidth: number | undefined
  isSticky?: boolean
}

export class DayOfWeekHeaderCells extends BaseComponent<DayOfWeekHeaderCellsProps> {
  createDayHeaderFormatter = memoize(createDayHeaderFormatter)

  render() {
    let { context } = this
    let { cells } = this.props

    let dayHeaderFormat = this.createDayHeaderFormatter(
      context.options.dayHeaderFormat,
      false, // datesRepDistinctDays
      cells.length,
    )

    return (
      <tr role="row">
        {cells.map((cell) => (
          <DayOfWeekHeaderCell
            key={cell.dow}
            cell={cell}
            dayHeaderFormat={dayHeaderFormat}
            colSpan={this.props.colSpan}
            colWidth={this.props.colWidth}
            isSticky={this.props.isSticky}
          />
        ))}
      </tr>
    )
  }
}
