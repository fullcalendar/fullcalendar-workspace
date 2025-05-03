import { CssDimValue } from '@fullcalendar/core'
import { DateComponent, DateFormatter, DateRange, fracToCssDim, generateClassName, getUniqueDomId, joinArrayishClassNames, joinClassNames, memoize, ViewProps, watchHeight } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement, createRef } from '@fullcalendar/core/preact'
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

interface SingleMonthState {
  titleHeight?: number
  tableHeaderHeight?: number
}

export class SingleMonth extends DateComponent<SingleMonthProps, SingleMonthState> {
  // memo
  private buildDayTableModel = memoize(buildDayTableModel)
  private createDayHeaderFormatter = memoize(createDayHeaderFormatter)
  private buildDateRowConfig = memoize(buildDateRowConfig)

  // ref
  private titleElRef = createRef<HTMLDivElement>()
  private tableHeaderElRef = createRef<HTMLDivElement>()

  // internal
  private slicer = new DayTableSlicer()
  private titleId = getUniqueDomId()
  private rootEl?: HTMLElement
  private renderProps?: SingleMonthContentArg
  private disconnectTitleHeight?: () => void
  private disconnectTableHeaderHeight?: () => void

  render() {
    const { props, state, context } = this
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

    const isTitleAndHeaderSticky = !forPrint && props.colCnt === 1
    const isAspectRatio = !forPrint || props.hasLateralSiblings
    const invAspectRatio = 1 / options.aspectRatio

    const rowHeightGuess = props.visibleWidth != null
      ? invAspectRatio * props.visibleWidth / 6
      : undefined

    const headerStickyBottom = isTitleAndHeaderSticky
      ? rowHeightGuess
      : undefined

    const titleStickyBottom = isTitleAndHeaderSticky && rowHeightGuess != null && state.tableHeaderHeight != null
      ? rowHeightGuess + state.tableHeaderHeight + 1
      : undefined

    const renderProps = this.renderProps = {
      colCnt: props.colCnt,
      isFirst: props.isFirst,
      isLast: props.isLast,
    }

    return (
      <div
        role='listitem'
        style={{ width: props.width }}
      >
        <div
          role='grid'
          aria-labelledby={this.titleId}
          data-date={props.isoDateStr}
          className={joinClassNames(
            generateClassName(options.singleMonthClassNames, renderProps),
            classNames.flexCol,
            props.hasLateralSiblings && classNames.breakInsideAvoid,
          )}
        >
          <div
            id={this.titleId}
            ref={this.titleElRef}
            className={joinClassNames(
              generateClassName(options.singleMonthTitleClassNames, {
                sticky: isTitleAndHeaderSticky,
                colCnt: props.colCnt,
              }),
              isTitleAndHeaderSticky && classNames.stickyT,
            )}
            style={{
              // HACK to keep zIndex above table-header,
              // because in Chrome, something about position:sticky on this title div
              // causes its bottom border to no be considered part of its mass,
              // and would get overlapped and hidden by the table-header div
              zIndex: isTitleAndHeaderSticky ? 3 : undefined, // TODO: className?
              marginBottom: titleStickyBottom,
            }}
          >
            {dateEnv.format(
              props.dateProfile.currentRange.start,
              props.titleFormat,
            )}
          </div>
          <div
            className={joinClassNames(
              generateClassName(options.singleMonthTableClassNames, {
                ...renderProps,
                stickyTitle: isTitleAndHeaderSticky,
              }),
              classNames.flexCol,
            )}
            style={{
              marginTop: titleStickyBottom != null ? -titleStickyBottom : undefined
            }}
          >
            <div
              ref={this.tableHeaderElRef}
              className={joinClassNames(
                generateClassName(options.singleMonthTableHeaderClassNames, {
                  sticky: isTitleAndHeaderSticky,
                  colCnt: props.colCnt,
                }),
                isTitleAndHeaderSticky && classNames.stickyT,
              )}
              style={{
                zIndex: isTitleAndHeaderSticky ? 2 : undefined, // TODO: className?
                top: isTitleAndHeaderSticky ? state.titleHeight : undefined,
                marginBottom: headerStickyBottom,
              }}
            >
              <DayGridHeaderRow
                {...rowConfig}
                role='row'
                borderBottom={false}
              />
              <div className={joinArrayishClassNames(options.dayHeaderDividerClassNames)} />
            </div>
            <div
              className={joinClassNames(
                isAspectRatio && classNames.rel,
                generateClassName(options.singleMonthTableBodyClassNames, {
                  colCnt: props.colCnt,
                })
              )}
              style={{
                zIndex: isTitleAndHeaderSticky ? 1 : undefined, // TODO: className?
                marginTop: headerStickyBottom != null ? -headerStickyBottom : undefined,
                paddingBottom: isAspectRatio ? fracToCssDim(invAspectRatio) : undefined,
              }}
            >
              <DayGridRows
                dateProfile={props.dateProfile}
                todayRange={props.todayRange}
                cellRows={dayTableModel.cellRows}
                className={isAspectRatio ? classNames.fill : ''}
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

  componentDidMount(): void {
    this.disconnectTitleHeight = watchHeight(this.titleElRef.current, (height) => {
      this.setState({ titleHeight: height })
    })

    this.disconnectTableHeaderHeight = watchHeight(this.tableHeaderElRef.current, (height) => {
      this.setState({ tableHeaderHeight: height })
    })
  }

  componentWillUnmount(): void {
    const { options } = this.context

    this.disconnectTitleHeight()
    this.disconnectTableHeaderHeight()

    options.singleMonthWillUnmount?.({
      el: this.rootEl,
      ...this.renderProps!,
    })
  }
}
