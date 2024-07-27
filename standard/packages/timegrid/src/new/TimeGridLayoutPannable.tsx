import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventSegUiInteractionState, Hit, Scroller, ScrollerInterface, ScrollerSyncerInterface, RefMap, getStickyFooterScrollbar, getStickyHeaderDates, setRef, getScrollerSyncerClass } from "@fullcalendar/core/internal"
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
  renderHeaderLabel: (tier: number, handleEl: (el: HTMLElement) => void, height: number) => ComponentChild
  renderHeaderContent: (model: HeaderCellModel, tier: number, handleEl: (el: HTMLElement) => void) => ComponentChild
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
  onTimeCoords?: () => void

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
  private headerLabelElRefMap = new RefMap<number, HTMLElement>()
  private headerContentElRefMaps: RefMap<HeaderCellKey, HTMLElement>[] = [] // TODO: rename this
  private allDayLabelElRef = createRef<HTMLElement>()
  private allDayContentElRefMap = new RefMap<string, HTMLElement>()
  private slatLabelElRefMap = new RefMap<string, HTMLElement>() // keyed by ISO-something
  private slatContentElRefMap = new RefMap<string, HTMLElement>() // keyed by ISO-something

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

    const { headerContentElRefMaps } = this
    for (let i = headerContentElRefMaps.length; i < props.headerTiers.length; i++) {
      headerContentElRefMaps.push(new RefMap())
    }
    // TODO: kill headerContentElRefMaps rows that are no longer used

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
                  this.headerLabelElRefMap.createRef(tierNum),
                  state.headerTierHeights[tierNum],
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
                  <div className='fcnew-tier' style={{ height: state.headerTierHeights[tierNum] }}>
                    {models.map((model) => (
                      props.renderHeaderContent(
                        model,
                        tierNum,
                        headerContentElRefMaps[tierNum].createRef(
                          props.getHeaderModelKey(model),
                        ),
                      )
                    ))}
                  </div>
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
                elRef={this.allDayLabelElRef}
                width={axisWidth}
                height={state.allDayHeight}
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
                    cellInnerElRefMap={this.allDayContentElRefMap}
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
                    elRef={this.slatLabelElRefMap.createRef(slatMeta.key)}
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
                      slatMeta={slatMeta}
                      elRef={this.slatContentElRefMap.createRef(slatMeta.key)}
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
    this.handleSizing()
    this.context.addResizeHandler(this.handleSizing)
    this.initScrollers()
  }

  componentDidUpdate(
    prevProps: TimeGridLayoutPannableProps<HeaderCellModel, HeaderCellKey>,
    prevState: TimeGridLayoutPannableState,
  ) {
    this.handleSizing()
    this.updateScrollers()

    if (
      this.state.slatHeight != null &&
      this.state.slatHeight !== prevState.slatHeight
    ) {
      this.props.onTimeCoords && this.props.onTimeCoords()
    }
  }

  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
    this.destroyScrollers()
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleSizing = () => {

    // axisWidth
    // ---------

    let maxAxisElWidth = 0
    let axisEls: HTMLElement[] = [
      ...this.headerLabelElRefMap.current.values(),
      this.allDayLabelElRef.current,
      ...this.slatLabelElRefMap.current.values(),
    ]

    for (let axisEl of axisEls) {
      maxAxisElWidth = Math.max(maxAxisElWidth, axisEl.offsetWidth)
    }

    this.setState({
      axisWidth: maxAxisElWidth
    })

    // headerTierHeights
    // -----------------

    let headerTierLength = this.props.headerTiers.length
    let headerTierHeights = []

    for (let i = 0; i < headerTierLength; i++) {
      let headerLabelEl = this.headerLabelElRefMap.current.get(i)
      let headerContentElRefMap = this.headerContentElRefMaps[i]

      let headerEls: HTMLElement[] = [
        headerLabelEl,
        ...headerContentElRefMap.current.values(),
      ]

      let maxHeaderHeight = 0

      for (let headerEl of headerEls) {
        maxHeaderHeight = Math.max(maxHeaderHeight, headerEl.offsetHeight)
      }

      headerTierHeights.push(maxHeaderHeight)
    }

    this.setState({
      headerTierHeights,
    })

    // allDayHeight
    // ------------

    let maxAllDayHeight = 0
    let allDayEls: HTMLElement[] = [
      this.allDayLabelElRef.current,
      ...this.allDayContentElRefMap.current.values(),
    ]

    for (let allDayEl of allDayEls) {
      maxAllDayHeight = Math.max(maxAllDayHeight, allDayEl.offsetHeight)
    }

    this.setState({
      allDayHeight: maxAllDayHeight,
    })

    // slatHeight
    // ----------

    let maxSlatHeight = 0

    for (const slatEl of this.slatLabelElRefMap.current.values()) {
      maxSlatHeight = Math.max(maxSlatHeight, slatEl.offsetHeight)
    }
    for (const slatEl of this.slatContentElRefMap.current.values()) {
      maxSlatHeight = Math.max(maxSlatHeight, slatEl.offsetHeight)
    }

    const slatHeight = maxSlatHeight + 1 // add border
    this.setState({ slatHeight })
    setRef(this.props.slatHeightRef, slatHeight)
  }

  handleWidth = (width: number) => {
    this.setState({ width })
  }

  handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({ leftScrollbarWidth })
  }

  handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({ rightScrollbarWidth })
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
