import { DateComponent, DateFormatter, DateRange, fracToCssDim, memoize, setRef, ViewProps, watchWidth } from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { buildDateRowConfig, buildDayTableModel, createDayHeaderFormatter, DayGridRows, DayTableSlicer, DayGridHeaderRow } from '@fullcalendar/daygrid/internal'

export interface SingleMonthProps extends ViewProps {
  todayRange: DateRange
  isoDateStr?: string
  titleFormat: DateFormatter
  flexBasis?: number | string
  widthRef?: Ref<number>
}

export class SingleMonth extends DateComponent<SingleMonthProps> {
  // memo
  private buildDayTableModel = memoize(buildDayTableModel)
  private createDayHeaderFormatter = memoize(createDayHeaderFormatter)
  private buildDateRowConfig = memoize(buildDateRowConfig)

  // ref
  private elRef = createRef<HTMLDivElement>()

  // internal
  private slicer = new DayTableSlicer()
  private disconnectWidth?: () => void

  render() {
    const { props, context } = this
    const { dateProfile } = props
    const { options } = context
    const dayTableModel = this.buildDayTableModel(dateProfile, context.dateProfileGenerator)
    const slicedProps = this.slicer.sliceProps(props, dateProfile, options.nextDayThreshold, context, dayTableModel)

    const dayHeaderFormat = this.createDayHeaderFormatter(
      options.dayHeaderFormat,
      false, // datesRepDistinctDays
      dayTableModel.colCnt,
    )
    const rowConfig = this.buildDateRowConfig(
      dayTableModel.headerDates,
      false, // datesRepDistinctDays
      dateProfile,
      props.todayRange,
      dayHeaderFormat,
      context,
    )

    const invAspectRatio = 1 / options.aspectRatio
    const invRowAspectRatio = invAspectRatio / dayTableModel.rowCnt

    return (
      <div
        data-date={props.isoDateStr}
        className="fc-multimonth-month fc-liquid"
        // override fc-liquid's basis. fc-grow isn't sufficient because doesn't set min-width:0
        style={{ flexBasis: props.flexBasis }}
        ref={this.elRef}
      >
        <div
          className="fc-multimonth-header"
          style={{ marginBottom: fracToCssDim(invRowAspectRatio) }}
        >
          <div className="fc-multimonth-title">
            {context.dateEnv.format(
              props.dateProfile.currentRange.start,
              props.titleFormat,
            )}
          </div>
          <DayGridHeaderRow
            {...rowConfig}
            className='fc-multimonth-header-row'
          />
        </div>
        <div
          className='fc-multimonth-body fc-rel'
          style={{
            marginTop: fracToCssDim(-invRowAspectRatio),
            paddingBottom: fracToCssDim(invAspectRatio),
          }}
        >
          <DayGridRows
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cellRows={dayTableModel.cellRows}
            forPrint={props.forPrint}
            className='fc-fill'

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

  componentDidMount(): void {
    this.disconnectWidth = watchWidth(this.elRef.current, (width) => {
      setRef(this.props.widthRef, width)
    })
  }

  componentWillUnmount(): void {
    this.disconnectWidth()
    setRef(this.props.widthRef, null)
  }
}
