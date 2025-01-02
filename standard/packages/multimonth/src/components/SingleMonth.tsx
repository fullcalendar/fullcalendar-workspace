import { CssDimValue } from '@fullcalendar/core'
import { DateComponent, DateFormatter, DateRange, fracToCssDim, getUniqueDomId, joinClassNames, memoize, ViewProps } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { buildDateRowConfig, buildDayTableModel, createDayHeaderFormatter, DayGridRows, DayTableSlicer, DayGridHeaderRow } from '@fullcalendar/daygrid/internal'

export interface SingleMonthProps extends ViewProps {
  todayRange: DateRange
  isoDateStr?: string
  titleFormat: DateFormatter
  width?: CssDimValue

  // for min-height and compactness
  // should INLCUDE scrollbars to avoid oscillation
  visibleWidth: number | undefined

  hasLateralSiblings: boolean // TODO: use lower-level indicator instead of referencing siblings
}

export class SingleMonth extends DateComponent<SingleMonthProps> {
  // memo
  private buildDayTableModel = memoize(buildDayTableModel)
  private createDayHeaderFormatter = memoize(createDayHeaderFormatter)
  private buildDateRowConfig = memoize(buildDateRowConfig)

  // internal
  private slicer = new DayTableSlicer()
  private titleId = getUniqueDomId()

  render() {
    const { props, context } = this
    const { dateProfile, forPrint } = props
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

    const isHeaderSticky = !forPrint
    const isAspectRatio = !forPrint || props.hasLateralSiblings

    return (
      <div
        aria-labelledby={this.titleId}
        data-date={props.isoDateStr}
        className={joinClassNames(
          'fc-multimonth-month',
          props.hasLateralSiblings && 'fc-break-inside-avoid',
        )}
        // override fc-liquid's basis. fc-grow isn't sufficient because doesn't set min-width:0
        style={{ width: props.width }}
      >
        <div
          className="fc-multimonth-header"
          style={{
            marginBottom: isHeaderSticky ? fracToCssDim(invRowAspectRatio) : undefined,
          }}
          // NOTE: sticky properties determined by CSS
        >
          <div id={this.titleId} className="fc-multimonth-title">
            {context.dateEnv.format(
              props.dateProfile.currentRange.start,
              props.titleFormat,
            )}
          </div>
          <DayGridHeaderRow
            {...rowConfig}
            role='row'
            className='fc-multimonth-header-row'
          />
        </div>
        <div
          className={joinClassNames(
            'fc-multimonth-body',
            isAspectRatio && 'fc-rel',
          )}
          style={{
            marginTop: isHeaderSticky ? fracToCssDim(-invRowAspectRatio) : undefined,
            paddingBottom: isAspectRatio ? fracToCssDim(invAspectRatio) : undefined,
          }}
        >
          <DayGridRows
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cellRows={dayTableModel.cellRows}
            className={isAspectRatio ? 'fc-fill' : ''}
            forPrint={forPrint && !props.hasLateralSiblings}
            dayMaxEvents={forPrint ? undefined : options.dayMaxEvents}
            dayMaxEventRows={(forPrint && props.hasLateralSiblings) ? 1 : options.dayMaxEventRows}

            // content
            fgEventSegs={slicedProps.fgEventSegs}
            bgEventSegs={slicedProps.bgEventSegs}
            businessHourSegs={slicedProps.businessHourSegs}
            dateSelectionSegs={slicedProps.dateSelectionSegs}
            eventDrag={slicedProps.eventDrag}
            eventResize={slicedProps.eventResize}
            eventSelection={slicedProps.eventSelection}

            // dimensions
            visibleWidth={props.visibleWidth}
          />
        </div>
      </div>
    )
  }
}
