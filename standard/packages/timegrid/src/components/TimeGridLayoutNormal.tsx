import { afterSize, BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventRangeProps, EventSegUiInteractionState, getIsHeightAuto, getStickyHeaderDates, Hit, joinClassNames, rangeContainsMarker, RefMap, Ruler, Scroller, ScrollerInterface, setRef, SlicedCoordRange } from "@fullcalendar/core/internal"
import { createElement, Fragment, Ref } from '@fullcalendar/core/preact'
import { DayGridHeaderRow, RowConfig, computeRowIsCompact } from '@fullcalendar/daygrid/internal'
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
import { computeSlatHeight, getSlatRowClassNames } from './util.js'
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
  private slatInnerMainHeightRefMap = new RefMap<string, number>(() => { // keyed by slatMeta.key
    afterSize(this.handleSlatInnerHeights)
  })
  private slatHeight?: number
  private prevSlatHeight?: number

  render() {
    const { props, state, context, slatLabelInnerWidthRefMap, slatLabelInnerHeightRefMap, slatInnerMainHeightRefMap, headerLabelInnerWidthRefMap } = this
    const { nowDate, forPrint } = props
    const { axisWidth, clientWidth, totalWidth } = state
    const { options } = context

    const endScrollbarWidth = (totalWidth != null && clientWidth != null)
      ? totalWidth - clientWidth
      : undefined

    const verticalScrolling = !forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !forPrint && getStickyHeaderDates(options)

    const slatCnt = props.slatMetas.length
    const [slatHeight, slatLiquid] = computeSlatHeight(
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

    return (
      <Fragment>
        {/* HEADER
        ---------------------------------------------------------------------------------------*/}
        {options.dayHeaders && (
          <div
            role='rowgroup'
            className={joinClassNames(
              // see note in TimeGridLayout about why we don't do fc-print-header
              'fc-timegrid-header fc-flex-col fc-border-b',
              stickyHeaderDates && 'fc-table-header-sticky',
            )}
          >
            {props.headerTiers.map((rowConfig, tierNum) => (
              <div
                key={tierNum}
                role='row'
                className={joinClassNames(
                  'fc-flex-row',
                  tierNum && 'fc-border-t'
                )}
              >
                {(options.weekNumbers && tierNum === props.headerTiers.length - 1 ) ? ( // last row?
                  <TimeGridWeekNumber
                    dateProfile={props.dateProfile}
                    innerWidthRef={this.handleWeekNumberInnerWidth}
                    innerHeightRef={headerLabelInnerWidthRefMap.createRef(tierNum)}
                    width={axisWidth}
                    isLiquid={false}
                  />
                ) : (
                  <TimeGridAxisEmpty
                    width={axisWidth}
                    isLiquid={false}
                  />
                )}
                <DayGridHeaderRow
                  {...rowConfig}
                  className='fc-border-s fc-liquid'
                />
                {Boolean(endScrollbarWidth) && (
                  <div
                    className='fc-border-s fc-filler'
                    style={{ minWidth: endScrollbarWidth }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        <div // the "body"
          role='rowgroup'
          className={joinClassNames(
            'fc-flex-col',
            verticalScrolling && 'fc-liquid',
          )}
        >
          {/* ALL-DAY
          ---------------------------------------------------------------------------------------*/}
          {options.allDaySlot && (
            <Fragment>
              <div role='row' className='fc-timegrid-allday fc-flex-row'>
                <TimeGridAllDayLabel
                  width={axisWidth}
                  innerWidthRef={this.handleAllDayLabelInnerWidth}
                />
                <TimeGridAllDayLane
                  dateProfile={props.dateProfile}
                  todayRange={props.todayRange}
                  cells={props.cells}
                  showDayNumbers={false}
                  forPrint={forPrint}
                  isHitComboAllowed={props.isHitComboAllowed}
                  className='fc-border-s fc-liquid'
                  isCompact={computeRowIsCompact(clientWidth, options)}

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
                    className='fc-border-s fc-filler'
                    style={{ minWidth: endScrollbarWidth }}
                  />
                )}
              </div>
              <div className='fc-rowdivider'></div>
            </Fragment>
          )}
          {/* SLATS
          -----------------------------------------------------------------------------------------*/}
          <Scroller
            vertical={verticalScrolling}
            className={joinClassNames(
              'fc-timegrid-body fc-flex-col fc-rel', // fc-rel for Ruler.fc-fill-start
              verticalScrolling && 'fc-liquid',
            )}
            ref={props.timeScrollerRef}
          >
            <div // canvas (grows b/c of filler at bottom)
              className='fc-flex-col fc-grow fc-rel'
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
                  'fc-flex-row',
                  !simplePrint && 'fc-fill',
                )}
              >
                <div
                  role='rowheader'
                  aria-label={options.timedText}
                  className='fc-content-box'
                  style={{ width: axisWidth }}
                />
                <TimeGridCols
                  dateProfile={props.dateProfile}
                  nowDate={props.nowDate}
                  todayRange={props.todayRange}
                  cells={props.cells}
                  slatCnt={slatCnt}
                  forPrint={forPrint}
                  isHitComboAllowed={props.isHitComboAllowed}
                  className='fc-liquid fc-border-s'

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
                      'fc-timegrid-slots fc-flex-col',
                      (verticalScrolling && options.expandRows) && 'fc-grow',
                      absPrint
                        ? 'fc-fill-x' // will assume top:0, height will be decided naturally
                        : 'fc-rel', // needs abs/rel for zIndex
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
                          innerWidthRef={slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                          innerHeightRef={slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
                          width={axisWidth}
                        />
                        <TimeGridSlatLane
                          {...slatMeta}
                          borderStart
                          innerHeightRef={slatInnerMainHeightRefMap.createRef(slatMeta.key)}
                        />
                      </div>
                    ))}
                  </div>

                  {rowsNotExpanding && (
                    <div class='fc-liquid fc-border-t fc-filler' />
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
            <Ruler widthRef={this.handleClientWidth} />
            <Ruler heightRef={this.handleClientHeight} className='fc-fill-start' />
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
    this.setState({ totalWidth })
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
    const slatMainInnerHeightMap = this.slatInnerMainHeightRefMap.current
    let max = 0

    for (const slatLabelInnerHeight of slatLabelInnerHeightMap.values()) {
      max = Math.max(max, slatLabelInnerHeight)
    }

    for (const slatInnerHeight of slatMainInnerHeightMap.values()) {
      max = Math.max(max, slatInnerHeight)
    }

    if (this.state.slatInnerHeight !== max) {
      this.setState({ slatInnerHeight: max })
    }
  }
}
