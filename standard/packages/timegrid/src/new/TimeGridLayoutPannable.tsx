import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventSegUiInteractionState, Hit, Scroller, ScrollerInterface, ScrollerSyncerInterface, RefMap, getStickyFooterScrollbar, getStickyHeaderDates, setRef, getScrollerSyncerClass, afterSize, isArraysEqual } from "@fullcalendar/core/internal"
import { Fragment, createElement, createRef, ComponentChild, Ref } from '@fullcalendar/core/preact'
import { computeColWidth, TableSeg } from '@fullcalendar/daygrid/internal'
import { TimeGridAllDayLabelCell } from "./TimeGridAllDayLabelCell.js"
import { TimeGridAllDayContent } from "./TimeGridAllDayContent.js"
import { TimeGridNowIndicatorArrow } from "./TimeGridNowIndicatorArrow.js"
import { TimeSlatMeta } from "../time-slat-meta.js"
import { TimeGridAxisCell } from "./TimeGridAxisCell.js"
import { TimeGridSlatCell } from "./TimeGridSlatCell.js"
import { TimeGridCols } from "./TimeGridCols.js"
import { TimeColsSeg } from "../TimeColsSeg.js"
import { TimeGridHeaderTier } from "./TimeGridHeaderTier.js"

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
    height: number | undefined,
  ) => ComponentChild
  renderHeaderContent: (
    model: HeaderCellModel,
    tier: number,
    innerHeightRef: Ref<number> | undefined,
    height: number | undefined,
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
  width?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
  axisWidth?: number
  headerTierHeights?: number[]
  allDayHeight?: number
  slatHeight?: number
}

export class TimeGridLayoutPannable<HeaderCellModel, HeaderCellKey> extends BaseComponent<TimeGridLayoutPannableProps<HeaderCellModel, HeaderCellKey>, TimeGridLayoutPannableState> {
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
    afterSize(this.handleSlatHeights)
  })
  private slatMainInnerHeightRefMap = new RefMap<string, number>(() => { // keyed by slatMeta.key
    afterSize(this.handleSlatHeights)
  })

  private axisScrollerRef = createRef<Scroller>()
  private mainScrollerRef = createRef<Scroller>()
  private headScrollerRef = createRef<Scroller>()
  private footScrollerRef = createRef<Scroller>()
  private allDayScrollerRef = createRef<Scroller>()

  private hScroller: ScrollerSyncerInterface
  private vScroller: ScrollerSyncerInterface

  render() {
    const { props, state, context } = this
    const { nowDate } = props
    const { axisWidth } = state
    const { options } = context

    const colCnt = props.headerTiers[0].length
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    const stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)
    const [canvasWidth, colWidth] = computeColWidth(colCnt, props.dayMinWidth, state.width)

    return (
      <Fragment>
        {options.dayHeaders && (
          <div className={[
            'fcnew-header',
            stickyHeaderDates ? 'fcnew-sticky' : '',
          ].join(' ')}>
            {/* LEFT */}
            <div className='fcnew-axis' style={{ width: axisWidth }}>
              {props.headerTiers.map((models, tierNum) => (
                props.renderHeaderLabel(
                  tierNum,
                  this.headerLabelInnerWidthRefMap.createRef(tierNum), // innerWidthRef
                  this.headerLabelInnerHeightRefMap.createRef(tierNum), // innerHeightRef
                  axisWidth, // width --- AHHH used above too
                  state.headerTierHeights[tierNum], // height
                )
              ))}
            </div>
            {/* RIGHT */}
            <Scroller
              ref={this.headScrollerRef}
              horizontal
              /* TODO: how to apply paddingRight/Left? */
            >
              <div className='fcnew-canvas' style={{ width: canvasWidth }}>
                {props.headerTiers.map((models, tierNum) => (
                  <TimeGridHeaderTier
                    tierNum={tierNum}
                    models={models}
                    renderHeaderContent={props.renderHeaderContent}
                    getHeaderModelKey={props.getHeaderModelKey}
                    height={state.headerTierHeights[tierNum]}
                    innerHeightRef={this.headerMainInnerHeightRefMap.createRef(tierNum)}
                  />
                ))}
              </div>
            </Scroller>
          </div>
        )}
        {options.allDaySlot && (
          <Fragment>
            <div>
              {/* LEFT */}
              <TimeGridAllDayLabelCell
                width={axisWidth}
                height={state.allDayHeight}
                innerWidthRef={this.handleAllDayLabelInnerWidth}
                innerHeightRef={this.handleAllDayLabelInnerHeight}
              />
              {/* RIGHT */}
              <Scroller
                ref={this.allDayScrollerRef}
                horizontal
              >
                <div className='fcnew-canvas' style={{ width: canvasWidth }}>
                  <TimeGridAllDayContent
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

                    // dimensions
                    colWidth={colWidth}
                    height={state.allDayHeight}

                    // refs
                    cellInnerHeightRef={this.handleAllDayMainInnerHeight}
                  />
                </div>
              </Scroller>
            </div>
            <div className='fcnew-divider'></div>
          </Fragment>
        )}
        <div>
          {/* LEFT */}
          <Scroller
            ref={this.axisScrollerRef}
            vertical
            elStyle={{ width: axisWidth }}
          >
            <div className='fcnew-canvas'>
              <div>{/* TODO: make TimeGridAxisCol ? */}
                <TimeGridNowIndicatorArrow nowDate={nowDate} />
              </div>
              {props.slatMetas.map((slatMeta) => (
                <div
                  key={slatMeta.key}
                  className='fcnew-row'
                  style={{
                    // TODO: move to cell?
                    height: state.slatHeight
                  }}
                >
                  <TimeGridAxisCell
                    {...slatMeta}
                    innerWidthRef={this.slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                    innerHeightRef={this.slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
                  />
                </div>
              ))}
            </div>
          </Scroller>
          {/* RIGHT */}
          <Scroller
            ref={this.mainScrollerRef}
            vertical
            horizontal
            widthRef={this.handleWidth}
            leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
            rightScrollbarWidthRef={this.handleRightScrollbarWidth}
          >
            <div className='fcnew-canvas' style={{ width: canvasWidth }}>
              <div>
                {props.slatMetas.map((slatMeta) => (
                  <div
                    key={slatMeta.key}
                    className='fcnew-row'
                    style={{
                      // TODO: move to cell?
                      height: state.slatHeight
                    }}
                  >
                    <TimeGridSlatCell
                      {...slatMeta}
                      innerHeightRef={this.slatMainInnerHeightRefMap.createRef(slatMeta.key)}
                    />
                  </div>
                ))}
              </div>
              <div className='fcnew-absolute'>
                <TimeGridCols
                  dateProfile={props.dateProfile}
                  nowDate={props.nowDate}
                  todayRange={props.todayRange}
                  cells={props.cells}
                  forPrint={props.forPrint}
                  isHitComboAllowed={props.isHitComboAllowed}

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
                  slatHeight={state.slatHeight}
                />
              </div>
            </div>
          </Scroller>
        </div>
        {stickyFooterScrollbar && (
          <div>
            {/* LEFT */}
            <div style={{ width: axisWidth }}></div>
            {/* RIGHT */}
            <Scroller ref={this.footScrollerRef}>
              <div
                className='fcnew-canvas'
                style={{ width: canvasWidth }}
              />
            </Scroller>
          </div>
        )}
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

  private handleWidth = (width: number) => {
    this.setState({ width })
  }

  private handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({ leftScrollbarWidth })
  }

  private handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({ rightScrollbarWidth })
  }

  private handleHeaderHeights = () => {
    const headerLabelInnerHeightMap = this.headerLabelInnerHeightRefMap.current
    const headerMainInnerHeightMap = this.headerMainInnerHeightRefMap.current
    const heights = []

    for (const [tierNum, labelHeight] of headerLabelInnerHeightMap.entries()) {
      heights[tierNum] = Math.max(labelHeight, headerMainInnerHeightMap.get(tierNum))
    }

    const { headerTierHeights } = this.state
    if (!headerTierHeights || !isArraysEqual(headerTierHeights, heights)) {
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

  private handleSlatHeights = () => {
    const slatLabelInnerHeightMap = this.slatLabelInnerHeightRefMap.current
    const slatMainInnerHeightMap = this.slatMainInnerHeightRefMap.current
    let max = 0

    for (const slatLabelInnerHeight of slatLabelInnerHeightMap.values()) {
      max = Math.max(max, slatLabelInnerHeight)
    }

    for (const slatMainInnerHeight of slatMainInnerHeightMap.values()) {
      max = Math.max(max, slatMainInnerHeight)
    }

    if (this.state.slatHeight !== max) {
      this.setState({ slatHeight: max })
    }
  }

  private handleAxisWidths = () => {
    const headerLabelInnerWidthMap = this.headerLabelInnerWidthRefMap.current
    const slatLabelInnerWidthMap = this.slatLabelInnerWidthRefMap.current
    let max = this.allDayLabelInnerWidth

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
    this.hScroller = new ScrollerSyncer(true) // horizontal=true
    this.vScroller = new ScrollerSyncer() // horizontal=false

    setRef(this.props.dayScrollerRef, this.hScroller)
    setRef(this.props.timeScrollerRef, this.vScroller)
  }

  updateScrollers() {
    this.hScroller.handleChildren([
      this.axisScrollerRef.current,
      this.mainScrollerRef.current,
    ])
    this.vScroller.handleChildren([
      this.headScrollerRef.current,
      this.allDayScrollerRef.current,
      this.mainScrollerRef.current,
      this.footScrollerRef.current,
    ])
  }

  destroyScrollers() {
    setRef(this.props.dayScrollerRef, null)
    setRef(this.props.timeScrollerRef, null)
  }
}
