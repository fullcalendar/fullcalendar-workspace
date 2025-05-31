import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventRangeProps, EventSegUiInteractionState, Hit, RefMap, Ruler, Scroller, ScrollerInterface, ScrollerSyncerInterface, SlicedCoordRange, FooterScrollbar, afterSize, getIsHeightAuto, getScrollerSyncerClass, getStickyFooterScrollbar, getStickyHeaderDates, isArraysEqual, joinClassNames, rangeContainsMarker, setRef, generateClassName, joinArrayishClassNames } from "@fullcalendar/core/internal"
import { Fragment, Ref, createElement, createRef } from '@fullcalendar/core/preact'
import classNames from '@fullcalendar/core/internal-classnames'
import { DayGridHeaderRow, RowConfig, computeColWidth } from '@fullcalendar/daygrid/internal'
import { TimeSlatMeta } from "../time-slat-meta.js"
import { TimeGridRange } from "../TimeColsSeg.js"
import { TimeGridAllDayLabel } from "./TimeGridAllDayLabel.js"
import { TimeGridAllDayLane } from "./TimeGridAllDayLane.js"
import { TimeGridCols } from "./TimeGridCols.js"
import { TimeGridNowIndicatorArrow } from "./TimeGridNowIndicatorArrow.js"
import { TimeGridSlatLabel } from "./TimeGridSlatLabel.js"
import { TimeGridSlatLane } from "./TimeGridSlatLane.js"
import { computeSlatHeight } from './util.js'
import { TimeGridWeekNumber } from "./TimeGridWeekNumber.js"
import { TimeGridAxisEmpty } from "./TimeGridAxisEmpty.js"
import { simplifiedTimeGridPrint } from "./TimeGridCol.js"

export interface TimeGridLayoutPannableProps {
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  cells: DayTableCell[]
  slatMetas: TimeSlatMeta[]
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
  dayScrollerRef?: Ref<ScrollerInterface>
  timeScrollerRef?: Ref<ScrollerInterface>
  slatHeightRef?: Ref<number>

  // dimensions
  dayMinWidth: number

  borderX: boolean
}

interface TimeGridLayoutPannableState {
  totalWidth?: number
  clientWidth?: number
  clientHeight?: number
  bottomScrollbarWidth?: number
  axisWidth?: number
  headerTierHeights: number[]
  slatInnerHeight?: number
}

export class TimeGridLayoutPannable extends BaseComponent<TimeGridLayoutPannableProps, TimeGridLayoutPannableState> {
  state: TimeGridLayoutPannableState = {
    headerTierHeights: [],
  }

  // refs
  private headerLabelInnerWidthRefMap = new RefMap<number, number>(() => { // keyed by tierNum
    afterSize(this.handleAxisWidths)
  })
  private headerLabelInnerHeightRefMap = new RefMap<number, number>(() => { // keyed by tierNum
    afterSize(this.handleHeaderHeights)
  })
  private headerMainInnerHeightRefMap = new RefMap<number, number>(() => { // keyed by tierNum
    afterSize(this.handleHeaderHeights)
  })
  private allDayLabelInnerWidth?: number
  private handleAllDayLabelInnerWidth = (width: number) => {
    this.allDayLabelInnerWidth = width
    afterSize(this.handleAxisWidths)
  }
  private slatLabelInnerWidthRefMap = new RefMap<string, number>(() => { // keyed by slatMeta.key
    afterSize(this.handleAxisWidths)
  })
  private slatLabelInnerHeightRefMap = new RefMap<string, number>(() => { // keyed by slatMeta.key
    afterSize(this.handleSlatInnerHeights)
  })
  private slatMainInnerHeightRefMap = new RefMap<string, number>(() => { // keyed by slatMeta.key
    afterSize(this.handleSlatInnerHeights)
  })
  private slatHeight?: number
  private prevSlatHeight?: number
  private headerScrollerRef = createRef<Scroller>()
  private allDayScrollerRef = createRef<Scroller>()
  private mainScrollerRef = createRef<Scroller>()
  private footScrollerRef = createRef<Scroller>()
  private axisScrollerRef = createRef<Scroller>()

  // internal
  private dayScroller: ScrollerSyncerInterface
  private timeScroller: ScrollerSyncerInterface

  render() {
    const {
      props,
      state,
      context,
      headerLabelInnerWidthRefMap,
      headerLabelInnerHeightRefMap,
      headerMainInnerHeightRefMap,
      slatLabelInnerWidthRefMap,
      slatLabelInnerHeightRefMap,
      slatMainInnerHeightRefMap,
    } = this
    const { nowDate, headerTiers, forPrint } = props
    const { axisWidth, totalWidth, clientWidth, clientHeight, bottomScrollbarWidth } = state
    const { options } = context

    const endScrollbarWidth = (totalWidth != null && clientWidth != null)
      ? totalWidth - clientWidth
      : undefined

    const verticalScrolling = !forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !forPrint && getStickyHeaderDates(options)
    const stickyFooterScrollbar = !forPrint && getStickyFooterScrollbar(options)

    const absPrint = forPrint && !simplifiedTimeGridPrint
    const simplePrint = forPrint && simplifiedTimeGridPrint

    const colCnt = props.cells.length
    // TODO: memo?
    const [canvasWidth, colWidth] = computeColWidth(colCnt, props.dayMinWidth, clientWidth)

    const slatCnt = props.slatMetas.length
    const [slatHeight, slatLiquid] = computeSlatHeight( // TODO: memo?
      verticalScrolling && options.expandRows,
      slatCnt,
      state.slatInnerHeight,
      clientHeight,
    )
    this.slatHeight = slatHeight

    // TODO: have computeSlatHeight return?
    const totalSlatHeight = (slatHeight || 0) * slatCnt

    const forcedBodyHeight = absPrint ? totalSlatHeight : undefined

    const rowsNotExpanding = verticalScrolling && !options.expandRows &&
      clientHeight != null && clientHeight > totalSlatHeight

    const firstBodyRowIndex = options.dayHeaders ? headerTiers.length + 1 : 1

    return (
      <Fragment>
        {options.dayHeaders && (
          <div
            className={joinClassNames(
              generateClassName(options.viewHeaderClassNames, {
                borderX: props.borderX,
                isSticky: stickyHeaderDates,
              }),
              // see note in TimeGridLayout about why we don't do classNames.printHeader
              stickyHeaderDates && classNames.tableHeaderSticky,
            )}
          >
            <div className={classNames.flexRow}>
              {/* HEADER / labels
              -------------------------------------------------------------------------------------*/}
              <div
                role='rowgroup'
                className={classNames.contentBox}
                style={{ width: axisWidth }}
              >
                {headerTiers.map((rowConfig, tierNum) => (
                  <div
                    key={tierNum}
                    role='row'
                    aria-rowindex={tierNum + 1}
                    className={joinArrayishClassNames(
                      options.dayHeaderRowClassNames,
                      classNames.flexRow,
                      classNames.contentBox,
                      tierNum < props.headerTiers.length - 1
                        ? classNames.borderOnlyB
                        : classNames.borderNone
                    )}
                    style={{
                      height: state.headerTierHeights[tierNum]
                    }}
                  >
                    {(options.weekNumbers && rowConfig.isDateRow) ? (
                      <TimeGridWeekNumber
                        dateProfile={props.dateProfile}
                        innerWidthRef={headerLabelInnerWidthRefMap.createRef(tierNum)}
                        innerHeightRef={headerLabelInnerHeightRefMap.createRef(tierNum)}
                        width={undefined}
                        isLiquid={true}
                      />
                    ) : (
                      <TimeGridAxisEmpty
                        width={undefined}
                        isLiquid={true}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div
                className={joinArrayishClassNames(options.slotLabelDividerClassNames)}
              />
              {/* HEADER / main (horizontal scroller)
              -------------------------------------------------------------------------------------*/}
              <Scroller
                horizontal
                hideScrollbars
                className={joinClassNames(classNames.flexRow, classNames.liquid)}
                ref={this.headerScrollerRef}
              >
                {/* TODO: converge with DayGridHeader */}
                <div
                  role='rowgroup'
                  className={canvasWidth == null ? classNames.liquid : ''}
                  style={{ width: canvasWidth }}
                >
                  {props.headerTiers.map((rowConfig, tierNum) => (
                    <DayGridHeaderRow
                      {...rowConfig}
                      key={tierNum}
                      role='row'
                      rowIndex={tierNum}
                      borderBottom={tierNum < props.headerTiers.length - 1}
                      height={state.headerTierHeights[tierNum]}
                      colWidth={colWidth}
                      innerHeightRef={headerMainInnerHeightRefMap.createRef(tierNum)}
                    />
                  ))}
                </div>
                {Boolean(endScrollbarWidth) && (
                  <div
                    className={joinArrayishClassNames(
                      options.fillerClassNames,
                      options.fillerXClassNames,
                    )}
                    style={{ minWidth: endScrollbarWidth }}
                  />
                )}
              </Scroller>
            </div>
            <div className={joinArrayishClassNames(options.dayHeaderDividerClassNames)} />
          </div>
        )}
        <div // the "body"
          role='rowgroup'
          className={joinClassNames(
            generateClassName(options.viewBodyClassNames, {
              borderX: props.borderX,
            }),
            classNames.flexCol,
            verticalScrolling && classNames.liquid,
          )}
        >
          {options.allDaySlot && (
            <Fragment>
              <div
                role='row'
                aria-rowindex={firstBodyRowIndex}
                className={classNames.flexRow}
              >
                {/* ALL-DAY / label
                -----------------------------------------------------------------------------------*/}
                <TimeGridAllDayLabel
                  width={axisWidth}
                  innerWidthRef={this.handleAllDayLabelInnerWidth}
                />
                <div
                  className={joinArrayishClassNames(options.slotLabelDividerClassNames)}
                />
                {/* ALL-DAY / main (horizontal scroller)
                -----------------------------------------------------------------------------------*/}
                <Scroller
                  horizontal
                  hideScrollbars
                  // fill remaining width
                  className={joinClassNames(classNames.flexRow, classNames.liquid)}
                  ref={this.allDayScrollerRef}
                >
                  <div
                    className={classNames.flexCol}
                    style={{ width: canvasWidth }}
                  >
                    <TimeGridAllDayLane
                      dateProfile={props.dateProfile}
                      todayRange={props.todayRange}
                      cells={props.cells}
                      showDayNumbers={false}
                      forPrint={forPrint}
                      isHitComboAllowed={props.isHitComboAllowed}
                      className={classNames.borderNone}
                      cellIsCompact={clientWidth / colCnt <= options.dayCompactWidth}

                      // content
                      fgEventSegs={props.fgEventSegs}
                      bgEventSegs={props.bgEventSegs}
                      businessHourSegs={props.businessHourSegs}
                      dateSelectionSegs={props.dateSelectionSegs}
                      eventSelection={props.eventSelection}
                      eventDrag={props.eventDrag}
                      eventResize={props.eventResize}
                      dayMaxEvents={props.dayMaxEvents}
                      dayMaxEventRows={props.dayMaxEventRows}

                      // dimensions
                      colWidth={colWidth}
                    />
                  </div>
                  {Boolean(endScrollbarWidth) && (
                    <div
                      className={joinArrayishClassNames(
                        options.fillerClassNames,
                        options.fillerXClassNames,
                      )}
                      style={{ minWidth: endScrollbarWidth }}
                    />
                  )}
                </Scroller>
              </div>
              {/* TODO: don't show div if no classname */}
              <div className={joinArrayishClassNames(options.allDayDividerClassNames)} />
            </Fragment>
          )}
          <div
            role='row'
            aria-rowindex={firstBodyRowIndex + (options.allDaySlot ? 1 : 0)}
            className={joinClassNames(
              classNames.flexRow,
              classNames.rel, // for Ruler.fillStart
              verticalScrolling && classNames.liquid,
            )}
          >
            {/* SLATS / labels (vertical scroller)
            ---------------------------------------------------------------------------------------*/}
            <Scroller
              vertical={verticalScrolling}
              hideScrollbars
              className={joinClassNames(classNames.flexCol, classNames.contentBox)}
              style={{
                width: axisWidth,
              }}
              ref={this.axisScrollerRef}
            >
              {!simplePrint && (
                <Fragment>
                  <div // canvas
                    role='rowheader'
                    aria-label={options.timedText}
                    className={joinClassNames(
                      classNames.flexCol,
                      classNames.grow,
                      classNames.rel, // for absPrint and TimeGridNowIndicatorArrow
                    )}
                    style={{
                      height: forcedBodyHeight,
                    }}
                  >
                    <div // label list
                      aria-hidden
                      className={joinClassNames(
                        classNames.flexCol,
                        (verticalScrolling && options.expandRows) && classNames.grow,
                        absPrint && classNames.fillX,
                      )}
                    >
                      {props.slatMetas.map((slatMeta, slatI) => (
                        <div
                          key={slatMeta.key}
                          className={joinClassNames(
                            slatLiquid && classNames.liquid,
                            classNames.flexCol,
                          )}
                          style={{
                            height: slatLiquid ? '' : slatHeight
                          }}
                        >
                          <TimeGridSlatLabel
                            {...slatMeta /* FYI doesn't need isoTimeStr */}
                            innerWidthRef={slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                            innerHeightRef={slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
                            borderTop={Boolean(slatI)}
                          />
                        </div>
                      ))}
                    </div>
                    {options.nowIndicator && rangeContainsMarker(props.dateProfile.currentRange, nowDate) && (
                      <TimeGridNowIndicatorArrow
                        nowDate={nowDate}
                        dateProfile={props.dateProfile}
                        totalHeight={slatHeight != null ? slatHeight * slatCnt : undefined}
                      />
                    )}
                    {Boolean(rowsNotExpanding || bottomScrollbarWidth) && (
                      <div
                        class={joinArrayishClassNames(
                          options.fillerClassNames,
                          options.fillerYClassNames,
                          rowsNotExpanding && classNames.liquid,
                        )}
                        style={{
                          minHeight: bottomScrollbarWidth
                        }}
                      />
                    )}
                  </div>
                </Fragment>
              )}
            </Scroller>
            <div
              className={joinArrayishClassNames(options.slotLabelDividerClassNames)}
            />
            {/* SLATS / main (scroller)
            ---------------------------------------------------------------------------------------*/}
            <div
              // we need this div because it's bad for Scroller to have left/right borders,
              // AND because we need to containt the FooterScrollbar
              className={joinClassNames(classNames.flexCol, classNames.liquid)}
            >
              <Scroller
                vertical={verticalScrolling}
                horizontal
                hideScrollbars={
                  stickyFooterScrollbar || // also means height:auto, so won't need vertical scrollbars anyway
                  forPrint
                }
                className={joinClassNames(
                  classNames.flexCol,
                  classNames.rel, // for Ruler.fillStart
                  verticalScrolling && classNames.liquid,
                )}
                ref={this.mainScrollerRef}
                clientWidthRef={this.handleClientWidth}
                clientHeightRef={this.handleClientHeight}
              >
                <div // canvas (grows b/c of filler at bottom)
                  className={joinClassNames(classNames.flexCol, classNames.grow, classNames.rel)}
                  style={{
                    width: canvasWidth,
                    height: forcedBodyHeight,
                  }}
                >
                  <TimeGridCols
                    dateProfile={props.dateProfile}
                    nowDate={props.nowDate}
                    todayRange={props.todayRange}
                    cells={props.cells}
                    slatCnt={slatCnt}
                    forPrint={forPrint}
                    isHitComboAllowed={props.isHitComboAllowed}
                    className={simplePrint ? '' : classNames.fill}

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
                    colWidth={colWidth}
                    slatHeight={slatHeight}
                  />

                  {!simplePrint && (
                    <Fragment>
                      <div // slot list
                        aria-hidden
                        className={joinClassNames(
                          classNames.flexCol,
                          (verticalScrolling && options.expandRows) && classNames.grow,
                          absPrint ? classNames.fillX : classNames.rel,
                        )}
                      >
                        {props.slatMetas.map((slatMeta, slatI) => (
                          <div
                            key={slatMeta.key}
                            className={joinClassNames(
                              classNames.flexRow,
                              slatLiquid && classNames.liquid,
                            )}
                            style={{
                              height: slatLiquid ? '' : slatHeight
                            }}
                          >
                            <TimeGridSlatLane
                              {...slatMeta /* FYI doesn't need isoTimeStr */}
                              innerHeightRef={slatMainInnerHeightRefMap.createRef(slatMeta.key)}
                              borderTop={Boolean(slatI)}
                            />
                          </div>
                        ))}
                      </div>
                      {rowsNotExpanding && (
                        <div
                          class={joinArrayishClassNames(
                            options.fillerClassNames,
                            options.fillerYClassNames,
                            classNames.liquid,
                          )}
                        />
                      )}
                    </Fragment>
                  )}
                </div>
              </Scroller>
              {Boolean(stickyFooterScrollbar) && (
                <FooterScrollbar
                  isSticky
                  canvasWidth={canvasWidth}
                  scrollerRef={this.footScrollerRef}
                  scrollbarWidthRef={this.handleBottomScrollbarWidth}
                />
              )}
            </div>
          </div>{/* END timed row */}
        </div>{/* END rowgroup */}
        <Ruler widthRef={this.handleTotalWidth} />
      </Fragment>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this.initScrollers()
    this.updateSlatHeight()
  }

  componentDidUpdate() {
    this.updateScrollers()
    this.updateSlatHeight()
  }

  componentWillUnmount() {
    this.destroyScrollers()

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
    this.setState({ totalWidth })
  }

  private handleClientWidth = (clientWidth: number) => {
    this.setState({ clientWidth })
  }

  private handleClientHeight = (clientHeight: number) => {
    this.setState({ clientHeight })
  }

  private handleBottomScrollbarWidth = (bottomScrollbarWidth: number) => {
    this.setState({ bottomScrollbarWidth })
  }

  private handleHeaderHeights = () => {
    const headerLabelInnerHeightMap = this.headerLabelInnerHeightRefMap.current
    const headerMainInnerHeightMap = this.headerMainInnerHeightRefMap.current
    const heights = []

    // important to loop using 'main' because 'label' might not be tracking height if empty
    for (const [tierNum, mainHeight] of headerMainInnerHeightMap.entries()) {
      heights[tierNum] = Math.max(headerLabelInnerHeightMap.get(tierNum) || 0, mainHeight)
    }

    const { headerTierHeights } = this.state
    if (!isArraysEqual(headerTierHeights, heights)) {
      this.setState({ headerTierHeights: heights })
    }
  }

  private handleSlatInnerHeights = () => {
    const slatLabelInnerHeightMap = this.slatLabelInnerHeightRefMap.current
    const slatMainInnerHeightMap = this.slatMainInnerHeightRefMap.current
    let max = 0

    for (const slatLabelInnerHeight of slatLabelInnerHeightMap.values()) {
      max = Math.max(max, slatLabelInnerHeight)
    }

    for (const slatMainInnerHeight of slatMainInnerHeightMap.values()) {
      max = Math.max(max, slatMainInnerHeight)
    }

    if (this.state.slatInnerHeight !== max) {
      this.setState({ slatInnerHeight: max })
    }
  }

  private handleAxisWidths = () => {
    const headerLabelInnerWidthMap = this.headerLabelInnerWidthRefMap.current
    const slatLabelInnerWidthMap = this.slatLabelInnerWidthRefMap.current
    let max = this.allDayLabelInnerWidth || 0 // guard against all-day slot hidden

    for (const headerLabelInnerWidth of headerLabelInnerWidthMap.values()) {
      max = Math.max(max, headerLabelInnerWidth)
    }

    for (const slatLableInnerWidth of slatLabelInnerWidthMap.values()) {
      max = Math.max(max, slatLableInnerWidth)
    }

    if (this.state.axisWidth !== max) {
      this.setState({ axisWidth: max })
    }
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  initScrollers() {
    const ScrollerSyncer = getScrollerSyncerClass(this.context.pluginHooks)

    this.dayScroller = new ScrollerSyncer(true) // horizontal=true
    this.timeScroller = new ScrollerSyncer() // horizontal=false

    setRef(this.props.dayScrollerRef, this.dayScroller)
    setRef(this.props.timeScrollerRef, this.timeScroller)

    this.updateScrollers()
  }

  updateScrollers() {
    this.dayScroller.handleChildren([
      this.headerScrollerRef.current,
      this.allDayScrollerRef.current,
      this.mainScrollerRef.current,
      this.footScrollerRef.current,
    ])

    this.timeScroller.handleChildren([
      this.axisScrollerRef.current,
      this.mainScrollerRef.current,
    ])
  }

  destroyScrollers() {
    setRef(this.props.dayScrollerRef, null)
    setRef(this.props.timeScrollerRef, null)
  }
}
