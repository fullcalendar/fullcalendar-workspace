import { DateComponent, ViewProps, memoize, DateFormatter, DateRange } from '@fullcalendar/core/internal'
import { buildDayTableModel, DayTableSlicer, DayGridRows, DayOfWeekHeaderCell, createDayHeaderFormatter } from '@fullcalendar/daygrid/internal'
import { createElement } from '@fullcalendar/core/preact'

export interface SingleMonthProps extends ViewProps {
  todayRange: DateRange
  isoDateStr?: string
  titleFormat: DateFormatter
  width: number | string // string is a temporary value
}

export class SingleMonth extends DateComponent<SingleMonthProps> {
  private slicer = new DayTableSlicer()

  // memo
  private buildDayTableModel = memoize(buildDayTableModel)
  private createDayHeaderFormatter = memoize(createDayHeaderFormatter)

  render() {
    const { props, context } = this
    const { dateProfile, forPrint } = props
    const { options } = context
    const dayTableModel = this.buildDayTableModel(dateProfile, context.dateProfileGenerator)
    const slicedProps = this.slicer.sliceProps(props, dateProfile, options.nextDayThreshold, context, dayTableModel)

    // ensure single-month has aspect ratio
    const tableHeight = typeof props.width === 'number'
      ? props.width / options.aspectRatio
      : null
    const rowCnt = dayTableModel.cellRows.length
    const rowHeight = tableHeight != null ? tableHeight / rowCnt : null

    const dayHeaderFormat = this.createDayHeaderFormatter(
      context.options.dayHeaderFormat,
      false, // datesRepDistinctDays
      dayTableModel.colCnt,
    )

    // TODO: tell children if we know dimensions are unstable?

    return (
      <div
        data-date={props.isoDateStr}
        role="grid"
        className="fc-multimonth-month fc-grow"
        style={{ width: props.width }}
      >
        <div
          className="fc-multimonth-header"
          style={{ marginBottom: rowHeight }} // for stickiness
          role="presentation"
        >
          <div className="fc-multimonth-title">
            {context.dateEnv.format(
              props.dateProfile.currentRange.start,
              props.titleFormat,
            )}
          </div>
          {/* TODO: somehow use HeaderRow or something? */}
          <div className='fc-multimonth-header-row fc-flex-row'>
            {dayTableModel.headerDates.map((headerDate, cellI) => (
              <DayOfWeekHeaderCell
                key={headerDate.getUTCDay()}
                dow={headerDate.getUTCDay()}
                dayHeaderFormat={dayHeaderFormat}
                colWidth={undefined}
                borderStart={Boolean(cellI)}
              />
            ))}
          </div>
        </div>
        <div
          className='fc-multimonth-body fc-flex-col'
          style={{
            marginTop: -rowHeight,
            height: forPrint ? '' : tableHeight,
          }}
        >
          <DayGridRows // .fc-grow
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cellRows={dayTableModel.cellRows}
            forPrint={props.forPrint}

            // content
            fgEventSegs={slicedProps.fgEventSegs}
            bgEventSegs={slicedProps.bgEventSegs}
            businessHourSegs={slicedProps.businessHourSegs}
            dateSelectionSegs={slicedProps.dateSelectionSegs}
            eventDrag={slicedProps.eventDrag}
            eventResize={slicedProps.eventResize}
            eventSelection={slicedProps.eventSelection}
          />
        </div>
      </div>
    )
  }
}
