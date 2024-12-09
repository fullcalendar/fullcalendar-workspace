import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventRangeProps, EventSegUiInteractionState, Hit, RefMap, Scroller, ScrollerInterface, ScrollerSyncerInterface, SlicedCoordRange, StickyFooterScrollbar, afterSize, getIsHeightAuto, getScrollerSyncerClass, getStickyFooterScrollbar, getStickyHeaderDates, isArraysEqual, joinClassNames, rangeContainsMarker, setRef } from "@fullcalendar/core/internal"
import { Fragment, Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { COMPACT_CELL_WIDTH, DayGridHeaderRow, RowConfig, computeColWidth } from '@fullcalendar/daygrid/internal'
import { TimeSlatMeta } from "../time-slat-meta.js"
import { TimeGridRange } from "../TimeColsSeg.js"
import { TimeGridAllDayLabel } from "./TimeGridAllDayLabel.js"
import { TimeGridAllDayLane } from "./TimeGridAllDayLane.js"
import { TimeGridCols } from "./TimeGridCols.js"
import { TimeGridNowIndicatorArrow } from "./TimeGridNowIndicatorArrow.js"
import { TimeGridSlatLabel } from "./TimeGridSlatLabel.js"
import { TimeGridSlatLane } from "./TimeGridSlatLane.js"
import { computeSlatHeight, getSlatRowClassNames } from './util.js'
import { TimeGridWeekNumber } from "./TimeGridWeekNumber.js"
import { TimeGridAxisEmpty } from "./TimeGridAxisEmpty.js"

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
}

interface TimeGridLayoutPannableState {
  clientWidth?: number
  clientHeight?: number
  endScrollbarWidth?: number
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
    const { nowDate, headerTiers } = props
    const { axisWidth } = state
    const { options } = context

    const verticalScrolling = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    const stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    const colCnt = props.cells.length
    // TODO: memo?
    const [canvasWidth, colWidth] = computeColWidth(colCnt, props.dayMinWidth, state.clientWidth)

    const slatCnt = props.slatMetas.length
    const [slatHeight, slatLiquid] = computeSlatHeight( // TODO: memo?
      verticalScrolling && options.expandRows,
      slatCnt,
      state.slatInnerHeight,
      state.clientHeight,
    )
    this.slatHeight = slatHeight

    // TODO: have computeSlatHeight return?
    const totalSlatHeight = (slatHeight || 0) * slatCnt

    const forcedBodyHeight = props.forPrint ? totalSlatHeight : undefined

    // TODO: better way to get this?
    const rowsAreExpanding = verticalScrolling && !options.expandRows &&
      state.clientHeight != null && state.clientHeight > totalSlatHeight

    const mainNeedsBottomFiller = rowsAreExpanding
    const axisNeedsBottomFiller = rowsAreExpanding || Boolean(state.bottomScrollbarWidth)

    return (
      <Fragment>
        {options.dayHeaders && (
          <div
            className={joinClassNames(
              // see note in TimeGridLayout about why we don't do fc-ps-header
              'fc-timegrid-header fc-flex-row fc-border-b',
              stickyHeaderDates && 'fc-table-header-sticky',
            )}
          >
            {/* HEADER / labels
            -------------------------------------------------------------------------------------*/}
            <div
              className='fc-content-box'
              style={{ width: axisWidth }}
            >
              {headerTiers.map((models, tierNum) => (
                <div
                  key={tierNum}
                  className={joinClassNames(
                    'fc-flex-row fc-content-box',
                    tierNum && 'fc-border-t',
                  )}
                  style={{ height: state.headerTierHeights[tierNum] }}
                >
                  {tierNum === headerTiers.length - 1 ? ( // last row?
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
            {/* HEADER / main (horizontal scroller)
            -------------------------------------------------------------------------------------*/}
            <Scroller
              horizontal
              hideScrollbars
              className='fc-flex-row fc-border-s fc-liquid'
              ref={this.headerScrollerRef}
            >
              {/* TODO: converge with DayGridHeader */}
              <div
                className={canvasWidth == null ? 'fc-liquid' : ''}
                style={{ width: canvasWidth }}
              >
                {props.headerTiers.map((rowConfig, tierNum) => (
                  <DayGridHeaderRow
                    {...rowConfig}
                    key={tierNum}
                    className={tierNum ? 'fc-border-t' : ''}
                    height={state.headerTierHeights[tierNum]}
                    colWidth={colWidth}
                    innerHeightRef={headerMainInnerHeightRefMap.createRef(tierNum)}
                  />
                ))}
              </div>
              {Boolean(state.endScrollbarWidth) && (
                <div
                  className='fc-border-s fc-filler'
                  style={{ minWidth: state.endScrollbarWidth }}
                />
              )}
            </Scroller>
          </div>
        )}
        {options.allDaySlot && (
          <Fragment>
            <div className='fc-timegrid-allday fc-flex-row'>
              {/* ALL-DAY / label
              -----------------------------------------------------------------------------------*/}
              <TimeGridAllDayLabel
                width={axisWidth}
                innerWidthRef={this.handleAllDayLabelInnerWidth}
              />
              {/* ALL-DAY / main (horizontal scroller)
              -----------------------------------------------------------------------------------*/}
              <Scroller
                horizontal
                hideScrollbars
                className='fc-border-s fc-flex-row fc-liquid' // fill remaining width
                ref={this.allDayScrollerRef}
              >
                <div
                  className='fc-ps-col'
                  style={{ width: canvasWidth }}
                >
                  <TimeGridAllDayLane
                    dateProfile={props.dateProfile}
                    todayRange={props.todayRange}
                    cells={props.cells}
                    showDayNumbers={false}
                    forPrint={props.forPrint}
                    isHitComboAllowed={props.isHitComboAllowed}
                    isCompact={
                      state.clientWidth != null
                        && state.clientWidth / props.cells.length < COMPACT_CELL_WIDTH
                    }

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
                {Boolean(state.endScrollbarWidth) && (
                  <div
                    className='fc-border-s fc-filler'
                    style={{ minWidth: state.endScrollbarWidth }}
                  />
                )}
              </Scroller>
            </div>
            <div className='fc-rowdivider'></div>
          </Fragment>
        )}
        <div
          className={joinClassNames(
            'fc-timegrid-body fc-flex-row',
            verticalScrolling && 'fc-liquid',
          )}
          style={{
            height: forcedBodyHeight,
          }}
        >
          {/* SLATS / labels (vertical scroller)
          ---------------------------------------------------------------------------------------*/}
          <Scroller
            vertical={verticalScrolling}
            hideScrollbars
            className='fc-ps-col fc-content-box'
            style={{ width: axisWidth }}
            ref={this.axisScrollerRef}
          >
            <div // canvas
              className='fc-ps-col fc-rel'
              style={{
                height: forcedBodyHeight,
              }}
            >
              <div // label list
                className={joinClassNames(
                  'fc-timegrid-slots-axis fc-ps-col',
                  props.forPrint && 'fc-fill-x',
                )}
              >
                {props.slatMetas.map((slatMeta, slatI) => (
                  <div
                    key={slatMeta.key}
                    className={joinClassNames(
                      ...getSlatRowClassNames(slatMeta),
                      slatI && 'fc-border-t',
                      slatLiquid && 'fc-liquid',
                    )}
                    style={{
                      height: slatLiquid ? '' : slatHeight
                    }}
                  >
                    <TimeGridSlatLabel
                      {...slatMeta}
                      isLiquid={true}
                      innerWidthRef={slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                      innerHeightRef={slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
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
            </div>
            {axisNeedsBottomFiller && (
              <div
                class='fc-liquid fc-border-t fc-filler'
                style={{ minHeight: state.bottomScrollbarWidth }}
              />
            )}
          </Scroller>
          {/* SLATS / main (scroller)
          ---------------------------------------------------------------------------------------*/}
          <div
            // we need this div because it's bad for Scroller to have left/right borders,
            // AND because we need to containt the StickyFooterScrollbar
            className='fc-border-s fc-liquid fc-ps-col'
          >
            <Scroller
              vertical={verticalScrolling}
              horizontal={!props.forPrint /* HACK for Firefox printing */}
              hideScrollbars={
                stickyFooterScrollbar || // also means height:auto, so won't need vertical scrollbars anyway
                props.forPrint // TODO: does this work!!??
              }
              className={joinClassNames(
                'fc-ps-col',
                verticalScrolling && 'fc-liquid',
              )}
              ref={this.mainScrollerRef}
              clientWidthRef={this.handleClientWidth}
              clientHeightRef={this.handleClientHeight}
              endScrollbarWidthRef={this.handleEndScrollbarWidth}
              bottomScrollbarWidthRef={this.handleBottomScrollbarWidth}
            >
              <div // canvas
                className='fc-ps-col fc-grow fc-rel'
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
                  forPrint={props.forPrint}
                  isHitComboAllowed={props.isHitComboAllowed}
                  className='fc-fill'
                  style={{
                    height: forcedBodyHeight,
                  }}

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
                <div // slot list
                  className={joinClassNames(
                    'fc-timegrid-slots fc-ps-col',
                    props.forPrint ? 'fc-fill-x' : 'fc-rel',
                  )}
                >
                  {props.slatMetas.map((slatMeta, slatI) => (
                    <div
                      key={slatMeta.key}
                      className={joinClassNames(
                        ...getSlatRowClassNames(slatMeta),
                        slatI && 'fc-border-t',
                        slatLiquid && 'fc-liquid',
                      )}
                      style={{
                        height: slatLiquid ? '' : slatHeight
                      }}
                    >
                      <TimeGridSlatLane
                        {...slatMeta}
                        innerHeightRef={slatMainInnerHeightRefMap.createRef(slatMeta.key)}
                      />
                    </div>
                  ))}
                </div>
                {mainNeedsBottomFiller && (
                  <div class='fc-liquid fc-border-t fc-filler' />
                )}
              </div>
            </Scroller>
            {Boolean(stickyFooterScrollbar) && (
              <StickyFooterScrollbar
                canvasWidth={canvasWidth}
                scrollerRef={this.footScrollerRef}
              />
            )}
          </div>
        </div>
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
  }

  updateSlatHeight() {
    if (this.prevSlatHeight !== this.slatHeight) {
      setRef(this.props.slatHeightRef, this.prevSlatHeight = this.slatHeight)
    }
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  private handleClientWidth = (clientWidth: number) => {
    this.setState({ clientWidth })
  }

  private handleClientHeight = (clientHeight: number) => {
    this.setState({ clientHeight })
  }

  private handleEndScrollbarWidth = (endScrollbarWidth: number) => {
    this.setState({ endScrollbarWidth })
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
