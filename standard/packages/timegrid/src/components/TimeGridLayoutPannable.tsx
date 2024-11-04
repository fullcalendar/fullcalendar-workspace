import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventSegUiInteractionState, Hit, Scroller, ScrollerInterface, ScrollerSyncerInterface, RefMap, getStickyFooterScrollbar, getStickyHeaderDates, setRef, getScrollerSyncerClass, afterSize, isArraysEqual, getIsHeightAuto, rangeContainsMarker, SlicedCoordRange, EventRangeProps, StickyFooterScrollbar, joinClassNames } from "@fullcalendar/core/internal"
import { Fragment, createElement, createRef, ComponentChild, Ref } from '@fullcalendar/core/preact'
import { computeColWidth, HeaderRowAdvanced, COMPACT_CELL_WIDTH } from '@fullcalendar/daygrid/internal'
import { TimeGridAllDayLabel } from "./TimeGridAllDayLabel.js"
import { TimeGridAllDayLane } from "./TimeGridAllDayLane.js"
import { TimeGridNowIndicatorArrow } from "./TimeGridNowIndicatorArrow.js"
import { TimeSlatMeta } from "../time-slat-meta.js"
import { TimeGridSlatLabel } from "./TimeGridSlatLabel.js"
import { TimeGridSlatLane } from "./TimeGridSlatLane.js"
import { TimeGridCols } from "./TimeGridCols.js"
import { TimeGridRange } from "../TimeColsSeg.js"
import { computeSlatHeight, getSlatRowClassNames } from './util.js'

export interface TimeGridLayoutPannableProps<HeaderCellModel, HeaderCellKey> {
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  cells: DayTableCell[]
  slatMetas: TimeSlatMeta[]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // header content
  headerTiers: HeaderCellModel[][]
  renderHeaderLabel: (
    tier: number,
    innerWidthRef: Ref<number> | undefined,
    innerHeightRef: Ref<number> | undefined,
    width: number | undefined,
  ) => ComponentChild
  renderHeaderContent: (
    model: HeaderCellModel,
    tier: number,
    innerHeightRef: Ref<number> | undefined,
    width: number | undefined,
  ) => ComponentChild
  getHeaderModelKey: (model: HeaderCellModel) => HeaderCellKey

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
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
  bottomScrollbarWidth?: number
  axisWidth?: number
  headerTierHeights: number[]
  slatInnerHeight?: number
}

export class TimeGridLayoutPannable<HeaderCellModel, HeaderCellKey> extends BaseComponent<TimeGridLayoutPannableProps<HeaderCellModel, HeaderCellKey>, TimeGridLayoutPannableState> {
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

    return (
      <Fragment>
        {options.dayHeaders && (
          <div
            className={joinClassNames(
              'fc-timegrid-header fc-table-header',
              stickyHeaderDates && 'fc-table-header-sticky',
              'fc-flex-row',
            )}
          >
            {/* HEADER / labels
            -------------------------------------------------------------------------------------*/}
            <div
              className='fc-cell fc-content-box' // a "super" cell
              style={{ width: axisWidth }}
            >
              {headerTiers.map((models, tierNum) => (
                <div
                  key={tierNum}
                  className='fc-row fc-content-box'
                  style={{ height: state.headerTierHeights[tierNum] }}
                >
                  {props.renderHeaderLabel( // .fc-cell
                    tierNum,
                    headerLabelInnerWidthRefMap.createRef(tierNum), // innerWidthRef
                    headerLabelInnerHeightRefMap.createRef(tierNum), // innerHeightRef
                    undefined, // width
                  )}
                </div>
              ))}
            </div>
            {/* HEADER / main (horizontal scroller)
            -------------------------------------------------------------------------------------*/}
            <Scroller
              horizontal
              hideScrollbars
              className='fc-cell fc-liquid'
              ref={this.headerScrollerRef}
            >
              <div
                className='fc-content-box'
                style={{
                  width: canvasWidth,
                  paddingLeft: state.leftScrollbarWidth,
                  paddingRight: state.rightScrollbarWidth,
                }}
              >
                {props.headerTiers.map((cells, tierNum) => (
                  <HeaderRowAdvanced // .fc-row
                    key={tierNum}
                    tierNum={tierNum}
                    cells={cells}
                    renderHeaderContent={props.renderHeaderContent}
                    getHeaderModelKey={props.getHeaderModelKey}
                    innerHeightRef={headerMainInnerHeightRefMap.createRef(tierNum)}
                    height={state.headerTierHeights[tierNum]}
                    colWidth={colWidth}
                  />
                ))}
              </div>
            </Scroller>
          </div>
        )}
        {options.allDaySlot && (
          <Fragment>
            {/* not fc-row because don't want border */}
            <div className='fc-timegrid-allday fc-table-body fc-flex-row'>
              {/* ALL-DAY / label
              -----------------------------------------------------------------------------------*/}
              <TimeGridAllDayLabel // .fc-cell
                innerWidthRef={this.handleAllDayLabelInnerWidth}
                width={axisWidth}
              />
              {/* ALL-DAY / main (horizontal scroller)
              -----------------------------------------------------------------------------------*/}
              <Scroller
                horizontal
                hideScrollbars
                className='fc-cell fc-flex-column fc-liquid' // fill remaining width
                ref={this.allDayScrollerRef}
              >
                <div
                  className='fc-content-box fc-flex-column fc-grow' // grow as tall as label cell
                  style={{
                    width: canvasWidth,
                    paddingLeft: state.leftScrollbarWidth,
                    paddingRight: state.rightScrollbarWidth,
                  }}
                >
                  <TimeGridAllDayLane
                    className='fc-grow' // grow as tall as label cell
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
              </Scroller>
            </div>
            <div className='fc-rowdivider'></div>
          </Fragment>
        )}
        <div className={joinClassNames(
          'fc-timegrid-body fc-table-body fc-flex-row',
          verticalScrolling && 'fc-liquid',
        )}>
          {/* SLATS / labels (vertical scroller)
          ---------------------------------------------------------------------------------------*/}
          <Scroller
            vertical={verticalScrolling}
            hideScrollbars
            className='fc-cell fc-flex-column fc-content-box'
            style={{
              width: axisWidth,
            }}
            ref={this.axisScrollerRef}
          >
            <div
              className='fc-timegrid-slots-axis fc-grow fc-flex-column fc-rel'
              style={{
                paddingBottom: state.bottomScrollbarWidth,
              }}
            >
              {props.slatMetas.map((slatMeta) => (
                <div
                  key={slatMeta.key}
                  className={joinClassNames(
                    ...getSlatRowClassNames(slatMeta),
                    slatLiquid && 'fc-liquid',
                  )}
                  style={{
                    height: slatLiquid ? '' : slatHeight
                  }}
                >
                  <TimeGridSlatLabel // .fc-cell
                    {...slatMeta}
                    width={undefined}
                    innerWidthRef={slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                    innerHeightRef={slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
                  />
                </div>
              ))}
              {options.nowIndicator && rangeContainsMarker(props.dateProfile.currentRange, nowDate) && (
                <TimeGridNowIndicatorArrow
                  nowDate={nowDate}
                  dateProfile={props.dateProfile}
                  totalHeight={slatHeight != null ? slatHeight * slatCnt : undefined}
                />
              )}
            </div>
          </Scroller>
          {/* SLATS / main (scroller)
          ---------------------------------------------------------------------------------------*/}
          <div
            // we need this div because it's bad for Scroller to have left/right borders,
            // AND because we need to containt the StickyFooterScrollbar
            className='fc-cell fc-liquid fc-flex-column' // a "super" cell
          >
            <Scroller
              vertical={verticalScrolling}
              horizontal
              hideScrollbars={stickyFooterScrollbar /* also means height:auto, so won't need vertical scrollbars anyway */}
              className={joinClassNames(
                'fc-flex-column',
                verticalScrolling && 'fc-liquid',
              )}
              ref={this.mainScrollerRef}
              clientWidthRef={this.handleClientWidth}
              clientHeightRef={this.handleClientHeight}
              leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
              rightScrollbarWidthRef={this.handleRightScrollbarWidth}
              bottomScrollbarWidthRef={this.handleBottomScrollbarWidth}
            >
              <div className='fc-grow fc-flex-column fc-rel' style={{ width: canvasWidth }}>
                <div className='fc-timegrid-slots fc-flex-column fc-grow'>
                  {props.slatMetas.map((slatMeta) => (
                    <div
                      key={slatMeta.key}
                      className={joinClassNames(
                        ...getSlatRowClassNames(slatMeta),
                        slatLiquid && 'fc-liquid',
                      )}
                      style={{
                        height: slatLiquid ? '' : slatHeight
                      }}
                    >
                      <TimeGridSlatLane // .fc-cell
                        {...slatMeta}
                        innerHeightRef={slatMainInnerHeightRefMap.createRef(slatMeta.key)}
                      />
                    </div>
                  ))}
                </div>
                <TimeGridCols
                  dateProfile={props.dateProfile}
                  nowDate={props.nowDate}
                  todayRange={props.todayRange}
                  cells={props.cells}
                  slatCnt={slatCnt}
                  forPrint={props.forPrint}
                  isHitComboAllowed={props.isHitComboAllowed}
                  className='fc-fill fc-liquid'

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

  private handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({ leftScrollbarWidth })
  }

  private handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({ rightScrollbarWidth })
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
