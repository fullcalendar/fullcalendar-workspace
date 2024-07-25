import { CssDimValue } from '@fullcalendar/core'
import { DateComponent, ViewProps, memoize, DateFormatter, DateRange, setRef } from '@fullcalendar/core/internal'
import { buildDayTableModel, DayTableSlicer, DayGridRows, DayOfWeekHeaderCell } from '@fullcalendar/daygrid/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'

export interface SingleMonthProps extends ViewProps {
  todayRange: DateRange

  elRef?: Ref<HTMLDivElement>
  isoDateStr?: string
  titleFormat: DateFormatter
  width: CssDimValue

  // TODO: why are these needed???
  tableWidth: number | null
  clientWidth: number | null
  clientHeight: number | null

  // TODO: rename `cells` to cellRows
}

interface SingleMonthState {
  width?: number
}

export class SingleMonth extends DateComponent<SingleMonthProps, SingleMonthState> {
  private buildDayTableModel = memoize(buildDayTableModel)
  private slicer = new DayTableSlicer()
  private rootEl: HTMLElement

  render() {
    const { props, context } = this
    const { dateProfile, forPrint } = props
    const { options } = context
    const dayTableModel = this.buildDayTableModel(dateProfile, context.dateProfileGenerator)
    const slicedProps = this.slicer.sliceProps(props, dateProfile, options.nextDayThreshold, context, dayTableModel)

    // ensure single-month has aspect ratio
    const tableHeight = props.tableWidth != null ? props.tableWidth / options.aspectRatio : null
    const rowCnt = dayTableModel.cells.length
    const rowHeight = tableHeight != null ? tableHeight / rowCnt : null

    return (
      <div
        ref={this.handleRootEl}
        data-date={props.isoDateStr}
        className="fc-multimonth-month"
        style={{ width: props.width }}
        role="grid"
      >
        <div
          className="fc-multimonth-header"
          style={{ marginBottom: rowHeight }} // for stickyness
          role="presentation"
        >
          <div className="fc-multimonth-title">
            {context.dateEnv.format(
              props.dateProfile.currentRange.start,
              props.titleFormat,
            )}
          </div>
          <div
            className={[
              'fc-multimonth-header-table',
              context.theme.getClass('table'),
            ].join(' ')}
          >
            {dayTableModel.headerDates.map((headerDate) => (
              <DayOfWeekHeaderCell
                key={headerDate.getUTCDay()}
                dow={headerDate.getUTCDay()}
                dayHeaderFormat={undefined /* TODO: figure `dayHeaderFormat` out */}
                colWidth={undefined}
              />
            ))}
          </div>
        </div>
        <div
          className={[
            'fc-multimonth-daygrid',
            'fc-daygrid',
            'fc-daygrid-body', // necessary for TableRows DnD parent
            !forPrint ? 'fc-daygrid-body-balanced' : '',
            forPrint ? 'fc-daygrid-body-unbalanced' : '',
            forPrint ? 'fc-daygrid-body-natural' : '',
          ].join(' ')}
          style={{ marginTop: -rowHeight }} // for stickyness
        >
          <div
            className={[
              'fc-multimonth-daygrid-table',
              context.theme.getClass('table'),
            ].join(' ')}
            style={{ height: forPrint ? '' : tableHeight }}
            role="presentation"
          >
            <DayGridRows
              dateProfile={props.dateProfile}
              todayRange={props.todayRange}
              cellRows={dayTableModel.cells}
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
      </div>
    )
  }

  handleRootEl = (rootEl: HTMLElement | null) => {
    this.rootEl = rootEl
    setRef(this.props.elRef, rootEl)
  }

  handleSizing = () => {
    this.safeSetState({
      width: this.rootEl.getBoundingClientRect().width
      /*
      TODO: never use .offsetHeight/offsetWidth anywhere else because we don't want integer-rounded anymore!
      */
    })
  }
}
