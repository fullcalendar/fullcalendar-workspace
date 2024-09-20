import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventSegUiInteractionState, Hit, Scroller, ScrollerInterface, ScrollerSyncerInterface, RefMap, getStickyFooterScrollbar, getStickyHeaderDates, setRef, getScrollerSyncerClass, afterSize, isArraysEqual, getIsHeightAuto, rangeContainsMarker } from "@fullcalendar/core/internal"
import { Fragment, createElement, createRef, ComponentChild, Ref } from '@fullcalendar/core/preact'
import { computeColWidth, TableSeg, HeaderRowAdvanced } from '@fullcalendar/daygrid/internal'
import { TimeGridAllDayLabel } from "./TimeGridAllDayLabel.js"
import { TimeGridAllDayLane } from "./TimeGridAllDayLane.js"
import { TimeGridNowIndicatorArrow } from "./TimeGridNowIndicatorArrow.js"
import { TimeSlatMeta } from "../time-slat-meta.js"
import { TimeGridSlatLabel } from "./TimeGridSlatLabel.js"
import { TimeGridSlatLane } from "./TimeGridSlatLane.js"
import { TimeGridCols } from "./TimeGridCols.js"
import { TimeColsSeg } from "../TimeColsSeg.js"
import { computeSlatHeight, getSlatRowClassName } from "./util.js"

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
  fgEventSegs: TableSeg[]
  bgEventSegs: TableSeg[]
  businessHourSegs: TableSeg[]
  dateSelectionSegs: TableSeg[]
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null
  dayMaxEvents: boolean | number
  dayMaxEventRows: boolean | number

  // timed content
  fgEventSegsByCol: TimeColsSeg[][]
  bgEventSegsByCol: TimeColsSeg[][]
  businessHourSegsByCol: TimeColsSeg[][]
  nowIndicatorSegsByCol: TimeColsSeg[][]
  dateSelectionSegsByCol: TimeColsSeg[][]
  eventDragByCol: EventSegUiInteractionState[]
  eventResizeByCol: EventSegUiInteractionState[]

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
  scrollerWidth?: number
  scrollerHeight?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
  bottomScrollbarWidth?: number
  axisWidth?: number
  headerTierHeights: number[]
  allDayHeight?: number
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
  private allDayLabelInnerHeight?: number
  private handleAllDayLabelInnerHeight = (height: number) => {
    this.allDayLabelInnerHeight = height
    afterSize(this.handleAllDayHeights)
  }
  private allDayMainInnerHeight?: number
  private handleAllDayMainInnerHeight = (height: number) => {
    this.allDayMainInnerHeight = height
    afterSize(this.handleAllDayHeights)
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
  private currentSlatHeight?: number
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
    const { nowDate } = props
    const { axisWidth } = state
    const { options } = context

    const colCnt = props.headerTiers[0].length
    const verticalScrolling = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    const stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    // TODO: memo?
    const [canvasWidth, colWidth] = computeColWidth(colCnt, props.dayMinWidth, state.scrollerWidth)

    const slatCnt = props.slatMetas.length
    const [slatHeight, slatLiquid] = computeSlatHeight( // TODO: memo?
      verticalScrolling && options.expandRows,
      slatCnt,
      state.slatInnerHeight,
      state.scrollerHeight,
    )

    if (this.currentSlatHeight !== slatHeight) {
      this.currentSlatHeight = slatHeight
      setRef(props.slatHeightRef, slatHeight)
    }

    return (
      <Fragment>
        {options.dayHeaders && (
          <div
            className={[
              'fcnew-row', // a "super" row
              stickyHeaderDates ? 'fcnew-sticky-header' : '',
            ].join(' ')}
          >
            {/* HEADER / labels
            -------------------------------------------------------------------------------------*/}
            <div
              className='fcnew-cell fcnew-timegrid-header-axises' // a "super" cell
              style={{ width: axisWidth }}
            >
              {props.headerTiers.map((models, tierNum) => (
                <div
                  key={tierNum}
                  className='fcnew-row'
                  style={{ height: state.headerTierHeights[tierNum] }}
                >
                  {props.renderHeaderLabel( // .fcnew-cell
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
              elClassNames={['fcnew-cell fcnew-liquid']} // a "super" cell
              // ^NOTE: not a good idea if ever gets left/right border
              ref={this.headerScrollerRef}
            >
              <div
                className='fcnew-content-box'
                style={{
                  width: canvasWidth,
                  paddingLeft: state.leftScrollbarWidth,
                  paddingRight: state.rightScrollbarWidth,
                }}
              >
                {props.headerTiers.map((cells, tierNum) => (
                  <HeaderRowAdvanced // .fcnew-row
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
            <div
              className='fcnew-row' // a "super" row
              style={{ height: state.allDayHeight }}
            >
              {/* ALL-DAY / label
              -----------------------------------------------------------------------------------*/}
              <TimeGridAllDayLabel // .fcnew-cell
                innerWidthRef={this.handleAllDayLabelInnerWidth}
                innerHeightRef={this.handleAllDayLabelInnerHeight}
                width={axisWidth}
              />
              {/* ALL-DAY / main (horizontal scroller)
              -----------------------------------------------------------------------------------*/}
              <Scroller
                horizontal
                hideScrollbars
                elClassNames={['fcnew-cell fcnew-liquid']} // a "super" cell
                // ^NOTE: not a good idea if ever gets left/right border
                ref={this.allDayScrollerRef}
              >
                <div
                  className='fcnew-content-box'
                  style={{
                    width: canvasWidth,
                    paddingLeft: state.leftScrollbarWidth,
                    paddingRight: state.rightScrollbarWidth,
                  }}
                >
                  <TimeGridAllDayLane // .fcnew-cellgroup
                    dateProfile={props.dateProfile}
                    todayRange={props.todayRange}
                    cells={props.cells}
                    showDayNumbers={false}
                    forPrint={props.forPrint}
                    isHitComboAllowed={props.isHitComboAllowed}

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

                    // refs
                    innerHeightRef={this.handleAllDayMainInnerHeight}

                    // dimensions
                    colWidth={colWidth}
                  />
                </div>
              </Scroller>
            </div>
            <div className='fcnew-rowdivider'></div>
          </Fragment>
        )}
        <div className={[ // a "super" row
          'fcnew-row',
          'fcnew-timegrid-timed-main',
          verticalScrolling ? 'fcnew-liquid' : '',
        ].join(' ')}>
          {/* SLATS / labels (vertical scroller)
          ---------------------------------------------------------------------------------------*/}
          <Scroller
            vertical={verticalScrolling}
            hideScrollbars
            elClassNames={[
              'fcnew-cell', // NOTE: not a good idea if ever gets left/right border
              'fcnew-timegrid-slot-labels',
            ]}
            elStyle={{ width: axisWidth }}
            ref={this.axisScrollerRef}
          >
            <div
              className='fcnew-rel fcnew-flex-column'
              style={{
                minHeight: '100%', // TODO: use className for this?
                paddingBottom: state.bottomScrollbarWidth,
              }}
            >
              {props.slatMetas.map((slatMeta) => (
                <div
                  key={slatMeta.key}
                  className={[
                    getSlatRowClassName(slatMeta),
                    slatLiquid ? 'fcnew-liquid' : ''
                  ].join(' ')}
                  style={{
                    height: slatLiquid ? '' : slatHeight
                  }}
                >
                  <TimeGridSlatLabel // .fcnew-cell
                    {...slatMeta}
                    width={undefined}
                    innerWidthRef={slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                    innerHeightRef={slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
                  />
                </div>
              ))}
              {rangeContainsMarker(props.dateProfile.currentRange, nowDate) && (
                <TimeGridNowIndicatorArrow
                  nowDate={nowDate}
                  dateProfile={props.dateProfile}
                />
              )}
            </div>
          </Scroller>
          {/* SLATS / main (scroller)
          ---------------------------------------------------------------------------------------*/}
          <div
            className='fcnew-cell fcnew-liquid fcnew-flex-column' // a "super" cell
          >
            <Scroller
              vertical={verticalScrolling}
              horizontal
              hideScrollbars={stickyFooterScrollbar /* also means height:auto, so won't need vertical scrollbars anyway */}
              elClassNames={[
                verticalScrolling ? 'fcnew-liquid' : '',
              ]}
              ref={this.mainScrollerRef}
              widthRef={this.handleScrollerWidth}
              heightRef={this.handleScrollerHeight}
              leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
              rightScrollbarWidthRef={this.handleRightScrollbarWidth}
              bottomScrollbarWidthRef={this.handleBottomScrollbarWidth}
            >
              <div
                className='fcnew-rel fcnew-flex-column'
                style={{
                  width: canvasWidth,
                  minHeight: '100%', // TODO: use className for this?
                }}
              >
                {props.slatMetas.map((slatMeta) => (
                  <div
                    key={slatMeta.key}
                    className={[
                      getSlatRowClassName(slatMeta),
                      slatLiquid ? 'fcnew-liquid' : ''
                    ].join(' ')}
                    style={{
                      height: slatLiquid ? '' : slatHeight
                    }}
                  >
                    <TimeGridSlatLane // .fcnew-cell
                      {...slatMeta}
                      innerHeightRef={slatMainInnerHeightRefMap.createRef(slatMeta.key)}
                    />
                  </div>
                ))}
                <TimeGridCols // .fcnew-cellgroup.fcnew-absfill
                  dateProfile={props.dateProfile}
                  nowDate={props.nowDate}
                  todayRange={props.todayRange}
                  cells={props.cells}
                  slatCnt={slatCnt}
                  forPrint={props.forPrint}
                  isHitComboAllowed={props.isHitComboAllowed}
                  className='fcnew-absfill fcnew-liquid'

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
              <Scroller
                horizontal
                elClassNames={['fcnew-sticky-footer']}
                elStyle={{
                  marginTop: '-1px', // HACK
                }}
                // ^NOTE: not a good idea if ever gets left/right border
                ref={this.footScrollerRef}
              >
                <div
                  style={{
                    boxSizing: 'content-box',
                    width: canvasWidth,
                    height: '1px', // HACK
                  }}
                />
              </Scroller>
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
  }

  componentDidUpdate() {
    this.updateScrollers()
  }

  componentWillUnmount() {
    this.destroyScrollers()
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  private handleScrollerWidth = (scrollerWidth: number) => {
    this.setState({ scrollerWidth })
  }

  private handleScrollerHeight = (scrollerHeight: number) => {
    this.setState({ scrollerHeight })
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

    for (const [tierNum, labelHeight] of headerLabelInnerHeightMap.entries()) {
      heights[tierNum] = Math.max(labelHeight, headerMainInnerHeightMap.get(tierNum))
    }

    const { headerTierHeights } = this.state
    if (!isArraysEqual(headerTierHeights, heights)) {
      this.setState({ headerTierHeights: heights })
    }
  }

  private handleAllDayHeights = () => {
    let max = Math.max(
      this.allDayLabelInnerHeight,
      this.allDayMainInnerHeight,
    )

    if (this.state.allDayHeight !== max) {
      this.setState({ allDayHeight: max })
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
    const { isRtl } = this.context

    this.dayScroller.handleChildren([
      this.headerScrollerRef.current,
      this.allDayScrollerRef.current,
      this.mainScrollerRef.current,
      this.footScrollerRef.current,
    ], isRtl)
    this.timeScroller.handleChildren([
      this.axisScrollerRef.current,
      this.mainScrollerRef.current,
    ], isRtl)
  }

  destroyScrollers() {
    setRef(this.props.dayScrollerRef, null)
    setRef(this.props.timeScrollerRef, null)
  }
}
