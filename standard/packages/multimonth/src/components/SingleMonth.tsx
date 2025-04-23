import { CssDimValue } from '@fullcalendar/core'
import { DateComponent, DateFormatter, DateRange, fracToCssDim, generateClassName, getUniqueDomId, joinArrayishClassNames, joinClassNames, memoize, ViewProps } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { buildDateRowConfig, buildDayTableModel, createDayHeaderFormatter, DayGridRows, DayTableSlicer, DayGridHeaderRow } from '@fullcalendar/daygrid/internal'
import { SingleMonthContentArg } from '../structs.js'

export interface SingleMonthProps extends ViewProps {
  todayRange: DateRange
  isoDateStr?: string
  titleFormat: DateFormatter
  width?: CssDimValue
  colCnt?: number
  isFirst: boolean
  isLast: boolean

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
  private rootEl?: HTMLElement
  private renderProps?: SingleMonthContentArg

  render() {
    const { props, context } = this
    const { dateProfile, forPrint } = props
    const { options, dateEnv } = context
    const dayTableModel = this.buildDayTableModel(dateProfile, context.dateProfileGenerator, dateEnv)
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

    const renderProps = this.renderProps = {
      colCnt: props.colCnt,
      isFirst: props.isFirst,
      isLast: props.isLast,
    }

    return (
      <div
        role='listitem'
        className='fc-multimonth-month-outer'
        style={{ width: props.width }}
      >
        <div
          role='grid'
          aria-labelledby={this.titleId}
          data-date={props.isoDateStr}
          className={joinClassNames(
            'fc-multimonth-month',
            props.hasLateralSiblings && 'fc-break-inside-avoid',
            generateClassName(options.singleMonthClassNames, renderProps),
          )}
        >
          <div
            className="fc-multimonth-header" // TODO: will go away
            style={{
              marginBottom: isHeaderSticky ? fracToCssDim(invRowAspectRatio) : undefined,
            }}
            // NOTE: sticky properties determined by CSS
          >
            <div
              id={this.titleId}
              className={joinClassNames(
                'fc-multimonth-title',
                generateClassName(options.singleMonthTitleClassNames, {
                  isSticky: isHeaderSticky,
                }),
              )}
            >
              {dateEnv.format(
                props.dateProfile.currentRange.start,
                props.titleFormat,
              )}
            </div>
            <div
              className={generateClassName(options.singleMonthHeaderClassNames, {
                isSticky: isHeaderSticky,
              })}
            >
              <DayGridHeaderRow
                {...rowConfig}
                role='row'
                className='fc-multimonth-header-row'
                borderBottom={false}
              />
            </div>
          </div>
          <div
            className={joinArrayishClassNames(
              'fc-multimonth-body',
              isAspectRatio && 'fc-rel',
              options.singleMonthBodyClassNames,
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
              dayMaxEventRows={
                (forPrint && props.hasLateralSiblings)
                  ? 1 // for side-by-side multimonths, limit to one row
                  : true // otherwise, always do +more link, never expand rows
              }

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
      </div>
    )
  }

  handleEl = (el: HTMLElement) => {
    const { options } = this.context

    if (el) {
      this.rootEl = el

      options.singleMonthDidMount?.({
        el: this.rootEl,
        ...this.renderProps!,
      })
    }
  }

  componentWillUnmount(): void {
    const { options } = this.context

    options.singleMonthWillUnmount?.({
      el: this.rootEl,
      ...this.renderProps!,
    })
  }
}
