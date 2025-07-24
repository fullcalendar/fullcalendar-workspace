import { afterSize, BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventRangeProps, EventSegUiInteractionState, generateClassName, getIsHeightAuto, getStickyHeaderDates, Hit, joinArrayishClassNames, joinClassNames, rangeContainsMarker, RefMap, Ruler, Scroller, ScrollerInterface, setRef, SlicedCoordRange } from "@fullcalendar/core/internal"
import { createElement, Fragment, Ref } from '@fullcalendar/core/preact'
import classNames from '@fullcalendar/core/internal-classnames'
import { DayGridHeaderRow, narrowDayHeaderWidth, RowConfig } from '@fullcalendar/daygrid/internal'
import { TimeSlatMeta } from "../time-slat-meta.js"
import { TimeGridRange } from "../TimeColsSeg.js"
import { TimeGridAllDayLabel } from "./TimeGridAllDayLabel.js"
import { TimeGridAllDayLane } from "./TimeGridAllDayLane.js"
import { TimeGridAxisEmpty } from "./TimeGridAxisEmpty.js"
import { TimeGridCols } from "./TimeGridCols.js"
import { TimeGridNowIndicatorArrow } from "./TimeGridNowIndicatorArrow.js"
import { TimeGridSlatLabel } from "./TimeGridSlatLabel.js"
import { TimeGridSlatLane } from "./TimeGridSlatLane.js"
import { TimeGridWeekNumber } from "./TimeGridWeekNumber.js"
import { computeSlatHeight } from './util.js'
import { simplifiedTimeGridPrint } from './TimeGridCol.js'

export interface TimeGridLayoutNormalProps {
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  cells: DayTableCell[]
  slatMetas: TimeSlatMeta[],
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // header content
  headerTiers: RowConfig<{ text: string, isDisabled: boolean }>[]

  // all-day content
  fgEventSegs: (SlicedCoordRange & EventRangeProps)[]
  bgEventSegs: (SlicedCoordRange & EventRangeProps)[]
  businessHourSegs: (SlicedCoordRange & EventRangeProps)[]
  dateSelectionSegs: (SlicedCoordRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<SlicedCoordRange> | null
  eventResize: EventSegUiInteractionState<SlicedCoordRange> | null
  dayMaxEvents: boolean | number
  dayMaxEventRows: boolean | number

  // timed content
  fgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  bgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  businessHourSegsByCol: (TimeGridRange & EventRangeProps)[][]
  nowIndicatorSegsByCol: TimeGridRange[][]
  dateSelectionSegsByCol: (TimeGridRange & EventRangeProps)[][]
  eventDragByCol: EventSegUiInteractionState<TimeGridRange>[]
  eventResizeByCol: EventSegUiInteractionState<TimeGridRange>[]

  // universal content
  eventSelection: string

  // refs
  timeScrollerRef?: Ref<ScrollerInterface>
  slatHeightRef?: Ref<number>

  borderlessX: boolean
  noEdgeEffects: boolean
}

interface TimeGridLayoutState {
  totalWidth?: number
  clientWidth?: number
  clientHeight?: number
  axisWidth?: number
  slatInnerHeight?: number
}

export class TimeGridLayoutNormal extends BaseComponent<TimeGridLayoutNormalProps, TimeGridLayoutState> {
  // refs
  private headerLabelInnerWidthRefMap = new RefMap<number, number>(() => { // keyed by tierNum
    afterSize(this.handleAxisInnerWidths)
  })
  private allDayLabelInnerWidth?: number
  private handleAllDayLabelInnerWidth = (width: number) => {
    this.allDayLabelInnerWidth = width
    afterSize(this.handleAxisInnerWidths)
  }
  private weekNumberInnerWidth?: number
  private handleWeekNumberInnerWidth = (width: number) => {
    this.weekNumberInnerWidth = width
    afterSize(this.handleAxisInnerWidths)
  }
  private slatLabelInnerWidthRefMap = new RefMap<string, number>(() => { // keyed by slatMeta.key
    afterSize(this.handleAxisInnerWidths)
  })
  private slatLabelInnerHeightRefMap = new RefMap<string, number>(() => { // keyed by slatMeta.key
    afterSize(this.handleSlatInnerHeights)
  })
  private slatHeight?: number
  private prevSlatHeight?: number

  render() {
    const { props, state, context, slatLabelInnerWidthRefMap, slatLabelInnerHeightRefMap, headerLabelInnerWidthRefMap } = this
    const { nowDate, forPrint } = props
    const { axisWidth, clientWidth, totalWidth } = state
    const { options } = context

    const endScrollbarWidth = (totalWidth != null && clientWidth != null)
      ? totalWidth - clientWidth
      : undefined

    const verticalScrolling = !forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !forPrint && getStickyHeaderDates(options)

    const slatCnt = props.slatMetas.length
    const [slatHeight, slatLiquidHeight] = computeSlatHeight(
      verticalScrolling && options.expandRows,
      slatCnt,
      state.slatInnerHeight,
      state.clientHeight,
    )
    this.slatHeight = slatHeight

    // TODO: have computeSlatHeight return?
    const totalSlatHeight = (slatHeight || 0) * slatCnt

    const rowsNotExpanding = verticalScrolling && !options.expandRows &&
      state.clientHeight != null && state.clientHeight > totalSlatHeight

    const absPrint = forPrint && !simplifiedTimeGridPrint
    const simplePrint = forPrint && simplifiedTimeGridPrint

    // for printing
    // in Chrome, slats and columns both need abs positioning within a relative container for them
    // to sync across pages, and the relative container needs an explicit height
    // in Firefox, same applies, but the flex-row for the cells has trouble spanning across page,
    // so we need to set explicit height on flex-row and all parents
    const forcedBodyHeight = absPrint ? totalSlatHeight : undefined

    const colCount = props.cells.length
    const colWidth = clientWidth != null ? clientWidth / colCount : undefined
    const cellIsCompact = colWidth != null && colWidth <= options.dayCompactWidth
    const cellIsNarrow = colWidth != null && colWidth <= narrowDayHeaderWidth

    return (
      <Fragment>
        {/* HEADER
        ---------------------------------------------------------------------------------------*/}
        {options.dayHeaders && (
          <div
            role='rowgroup'
            className={joinClassNames(
              generateClassName(options.tableHeaderClass, {
                isSticky: stickyHeaderDates,
              }),
              props.borderlessX && classNames.borderlessX,
              // see note in TimeGridLayout about why we don't do classNames.printHeader
              classNames.flexCol,
              stickyHeaderDates && classNames.tableHeaderSticky,
            )}
          >
            {props.headerTiers.map((rowConfig, tierNum) => (
              <div
                key={tierNum}
                role='row'
                className={classNames.flexRow}
              >
                <div
                  className={joinArrayishClassNames(
                    options.dayHeaderRowClass,
                    classNames.flexRow,
                    tierNum < props.headerTiers.length - 1
                      ? classNames.borderOnlyB
                      : classNames.borderNone
                  )}
                >
                  {(options.weekNumbers && rowConfig.isDateRow) ? (
                    <TimeGridWeekNumber
                      dateProfile={props.dateProfile}
                      innerWidthRef={this.handleWeekNumberInnerWidth}
                      innerHeightRef={headerLabelInnerWidthRefMap.createRef(tierNum)}
                      width={axisWidth}
                      isLiquid={false}
                      isCompact={cellIsCompact}
                    />
                  ) : (
                    <TimeGridAxisEmpty
                      width={axisWidth}
                      isLiquid={false}
                    />
                  )}
                </div>
                <div
                  className={generateClassName(options.slotLabelDividerClass, { isHeader: true })}
                />
                <DayGridHeaderRow
                  {...rowConfig}
                  className={classNames.liquid}
                  borderBottom={tierNum < props.headerTiers.length - 1}
                  cellIsCompact={cellIsCompact}
                  cellIsNarrow={cellIsNarrow}
                />
                {Boolean(endScrollbarWidth) && (
                  <div
                    className={joinArrayishClassNames(
                      generateClassName(options.fillerClass, { isHeader: true }),
                      classNames.borderOnlyS,
                    )}
                    style={{ minWidth: endScrollbarWidth }}
                  />
                )}
              </div>
            ))}
            <div className={generateClassName(options.dayHeaderDividerClass, { hasAllDaySlot: Boolean(options.allDaySlot) })} />
          </div>
        )}
        <div // the "body"
          role='rowgroup'
          className={joinArrayishClassNames(
            options.tableBodyClass,
            props.borderlessX && classNames.borderlessX,
            stickyHeaderDates && classNames.borderlessTop,
            (stickyHeaderDates || props.noEdgeEffects) && classNames.noEdgeEffects,
            classNames.flexCol,
            verticalScrolling && classNames.liquid,
          )}
        >
          {/* ALL-DAY
          ---------------------------------------------------------------------------------------*/}
          {options.allDaySlot && (
            <Fragment>
              <div role='row' className={classNames.flexRow}>
                <TimeGridAllDayLabel
                  width={axisWidth}
                  innerWidthRef={this.handleAllDayLabelInnerWidth}
                  isCompact={cellIsCompact}
                />
                <div
                  className={generateClassName(options.slotLabelDividerClass, { isHeader: false })}
                />
                <TimeGridAllDayLane
                  dateProfile={props.dateProfile}
                  todayRange={props.todayRange}
                  cells={props.cells}
                  showDayNumbers={false}
                  forPrint={forPrint}
                  isHitComboAllowed={props.isHitComboAllowed}
                  className={joinClassNames(classNames.liquidX, classNames.borderNone)}
                  cellIsCompact={cellIsCompact}
                  // content
                  fgEventSegs={props.fgEventSegs}
                  bgEventSegs={props.bgEventSegs}
                  businessHourSegs={props.businessHourSegs}
                  dateSelectionSegs={props.dateSelectionSegs}
                  eventDrag={props.eventDrag}
                  eventResize={props.eventResize}
                  eventSelection={props.eventSelection}
                  dayMaxEvents={props.dayMaxEvents}
                  dayMaxEventRows={props.dayMaxEventRows}
                />
                {Boolean(endScrollbarWidth) && (
                  <div
                    className={joinArrayishClassNames(
                      generateClassName(options.fillerClass, { isHeader: false }),
                      classNames.borderOnlyS,
                    )}
                    style={{ minWidth: endScrollbarWidth }}
                  />
                )}
              </div>
              {/* TODO: don't show div if no classname */}
              <div className={joinArrayishClassNames(options.allDayDividerClass)} />
            </Fragment>
          )}
          {/* SLATS
          -----------------------------------------------------------------------------------------*/}
          <Scroller
            vertical={verticalScrolling}
            className={joinClassNames(
              classNames.flexCol,
              classNames.rel, // for Ruler.fillStart
              verticalScrolling && classNames.liquid,
            )}
            ref={props.timeScrollerRef}
            clientWidthRef={this.handleClientWidth}
            clientHeightRef={this.handleClientHeight}
          >
            <div // canvas (grows b/c of filler at bottom)
              className={joinClassNames(
                classNames.flexCol,
                classNames.grow,
                classNames.rel,
              )}
              style={{
                // in print mode, this div creates the height and everything is absolutely positioned within
                // we need to do this so that slats positioning synces with events's positioning
                // otherwise, get out of sync on second page
                height: forcedBodyHeight,
              }}
            >
              <div
                role='row'
                className={joinClassNames(
                  classNames.flexRow,
                  !simplePrint && classNames.fill,
                )}
              >
                <div
                  role='rowheader'
                  aria-label={options.timedText}
                  className={classNames.contentBox}
                  style={{ width: axisWidth }}
                />
                <div
                  className={generateClassName(options.slotLabelDividerClass, { isHeader: false })}
                />
                <TimeGridCols
                  dateProfile={props.dateProfile}
                  nowDate={props.nowDate}
                  todayRange={props.todayRange}
                  cells={props.cells}
                  slatCnt={slatCnt}
                  forPrint={forPrint}
                  isHitComboAllowed={props.isHitComboAllowed}
                  className={classNames.liquid}

                  // content
                  fgEventSegsByCol={props.fgEventSegsByCol}
                  bgEventSegsByCol={props.bgEventSegsByCol}
                  businessHourSegsByCol={props.businessHourSegsByCol}
                  nowIndicatorSegsByCol={props.nowIndicatorSegsByCol}
                  dateSelectionSegsByCol={props.dateSelectionSegsByCol}
                  eventDragByCol={props.eventDragByCol}
                  eventResizeByCol={props.eventResizeByCol}
                  eventSelection={props.eventSelection}

                  // dimensions
                  slatHeight={slatHeight}
                />
              </div>

              {!simplePrint && (
                <Fragment>
                  <div
                    aria-hidden
                    className={joinClassNames(
                      classNames.flexCol,
                      (verticalScrolling && options.expandRows) && classNames.grow,
                      absPrint
                        ? classNames.fillX // will assume top:0, height will be decided naturally
                        : classNames.rel, // needs abs/rel for zIndex
                    )}
                  >
                    {props.slatMetas.map((slatMeta, slatI) => (
                      <div
                        key={slatMeta.key}
                        className={joinClassNames(
                          slatLiquidHeight && classNames.liquid,
                          classNames.flexRow,
                        )}
                        style={{
                          height: slatLiquidHeight ? undefined : slatHeight
                        }}
                      >
                        <div
                          // the pannable version of TimeGrid has axis labels all consecutive in one column
                          // simulate this for the non-pannable version
                          className={classNames.flexCol}
                          style={{ width: axisWidth }}
                        >
                          <TimeGridSlatLabel
                            {...slatMeta /* FYI doesn't need isoTimeStr */}
                            innerWidthRef={slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                            innerHeightRef={slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
                            borderTop={Boolean(slatI)}
                            isCompact={cellIsCompact}
                          />
                        </div>
                        <div
                          className={generateClassName(options.slotLabelDividerClass, { isHeader: false })}
                          style={{ visibility: 'hidden' }}
                          // ^TODO: className?
                          // invisible because dayLanes show the line
                        />
                        <TimeGridSlatLane
                          {...slatMeta /* FYI doesn't need isoTimeStr */}
                          borderTop={Boolean(slatI)}
                        />
                      </div>
                    ))}
                  </div>

                  {rowsNotExpanding && (
                    <div
                      class={joinArrayishClassNames(
                        generateClassName(options.fillerClass, { isHeader: false }),
                        classNames.borderOnlyT,
                        classNames.liquid,
                      )}
                    />
                  )}

                  {options.nowIndicator && rangeContainsMarker(props.dateProfile.currentRange, nowDate) && (
                    <TimeGridNowIndicatorArrow
                      nowDate={nowDate}
                      dateProfile={props.dateProfile}
                      totalHeight={slatHeight != null ? slatHeight * slatCnt : undefined}
                    />
                  )}
                </Fragment>
              )}
            </div>
          </Scroller>
        </div>
        <Ruler widthRef={this.handleTotalWidth} />
      </Fragment>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this.updateSlatHeight()
  }

  componentDidUpdate() {
    this.updateSlatHeight()
  }

  componentWillUnmount(): void {
    setRef(this.props.slatHeightRef, null)
  }

  updateSlatHeight() {
    if (this.prevSlatHeight !== this.slatHeight) {
      setRef(this.props.slatHeightRef, this.prevSlatHeight = this.slatHeight)
    }
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  private handleTotalWidth = (totalWidth: number) => {
    // Must delay the rerender because might change the width of the all-day DayGridRow events,
    // which shows a ResizeObserver loop warning
    requestAnimationFrame(() => {
      this.setState({ totalWidth })
    })
  }

  private handleClientWidth = (clientWidth: number) => {
    this.setState({ clientWidth })
  }

  private handleClientHeight = (clientHeight: number) => {
    this.setState({ clientHeight })
  }

  private handleAxisInnerWidths = () => {
    const headerLabelInnerWidthMap = this.headerLabelInnerWidthRefMap.current
    const slatLabelInnerWidthMap = this.slatLabelInnerWidthRefMap.current
    let max = Math.max(
      this.weekNumberInnerWidth || 0, // might not exist
      this.allDayLabelInnerWidth || 0 // guard against all-day slot hidden
    )

    for (const headerLabelInnerWidth of headerLabelInnerWidthMap.values()) {
      max = Math.max(max, headerLabelInnerWidth)
    }

    for (const slatLabelInnerWidth of slatLabelInnerWidthMap.values()) {
      max = Math.max(max, slatLabelInnerWidth)
    }

    if (this.state.axisWidth !== max) {
      this.setState({ axisWidth: max })
    }
  }

  private handleSlatInnerHeights = () => {
    const slatLabelInnerHeightMap = this.slatLabelInnerHeightRefMap.current
    let max = 0

    for (const slatLabelInnerHeight of slatLabelInnerHeightMap.values()) {
      max = Math.max(max, slatLabelInnerHeight)
    }

    if (this.state.slatInnerHeight !== max) {
      this.setState({ slatInnerHeight: max })
    }
  }
}
