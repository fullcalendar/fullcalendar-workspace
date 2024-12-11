import { afterSize, BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventRangeProps, EventSegUiInteractionState, getIsHeightAuto, getStickyHeaderDates, Hit, joinClassNames, rangeContainsMarker, RefMap, Scroller, ScrollerInterface, setRef, SlicedCoordRange } from "@fullcalendar/core/internal"
import { createElement, Fragment, Ref } from '@fullcalendar/core/preact'
import { computeRowHeight, DayGridHeaderRow, RowConfig } from '@fullcalendar/daygrid/internal'
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
  clientWidth?: number
  clientHeight?: number
  endScrollbarWidth?: number
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
    const { nowDate } = props
    const { axisWidth } = state
    const { options } = context

    const verticalScrolling = !props.forPrint && !getIsHeightAuto(options)
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)

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

    // TODO: better way to get this?
    const rowsAreExpanding = verticalScrolling && !options.expandRows &&
      state.clientHeight != null && state.clientHeight > totalSlatHeight

    const needsBottomFiller = rowsAreExpanding

    // for printing
    // in Chrome, slats and columns both need abs positioning within a relative container for them
    // to sync across pages, and the relative container needs an explicit height
    // in Firefox, same applies, but the flex-row for the cells has trouble spanning across page,
    // so we need to set explicit height on flex-row and all parents
    const forcedBodyHeight = props.forPrint ? totalSlatHeight : undefined

    const axisStartCss = context.isRtl
      ? { right: axisWidth }
      : { left: axisWidth }

    return (
      <Fragment>
        {/* HEADER
        ---------------------------------------------------------------------------------------*/}
        {options.dayHeaders && (
          <div
            className={joinClassNames(
              // see note in TimeGridLayout about why we don't do fc-ps-header
              'fc-timegrid-header fc-flex-col fc-border-b',
              stickyHeaderDates && 'fc-table-header-sticky',
            )}
          >
            {props.headerTiers.map((rowConfig, tierNum) => (
              <div
                key={tierNum}
                className={joinClassNames(
                  'fc-flex-row',
                  tierNum && 'fc-border-t'
                )}
              >
                {tierNum === props.headerTiers.length - 1 ? ( // last row?
                  <TimeGridWeekNumber
                    dateProfile={props.dateProfile}
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
                {Boolean(state.endScrollbarWidth) && (
                  <div
                    className='fc-border-s fc-filler'
                    style={{ minWidth: state.endScrollbarWidth }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {/* ALL-DAY
        ---------------------------------------------------------------------------------------*/}
        {options.allDaySlot && (
          <Fragment>
            <div
              // TODO: role="rowgroup"
              className='fc-timegrid-allday fc-flex-col'
            >
              <div className='fc-flex-row'>
                <TimeGridAllDayLabel
                  width={axisWidth}
                  innerWidthRef={this.handleAllDayLabelInnerWidth}
                />
                <TimeGridAllDayLane
                  dateProfile={props.dateProfile}
                  todayRange={props.todayRange}
                  cells={props.cells}
                  showDayNumbers={false}
                  forPrint={props.forPrint}
                  isHitComboAllowed={props.isHitComboAllowed}
                  className='fc-border-s fc-liquid'
                  isCompact={computeRowHeight(state.clientWidth, 1, true, props.forPrint, options)[1]}

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
                {Boolean(state.endScrollbarWidth) && (
                  <div
                    className='fc-border-s fc-filler'
                    style={{ minWidth: state.endScrollbarWidth }}
                  />
                )}
              </div>
            </div>
            <div className='fc-rowdivider'></div>
          </Fragment>
        )}
        {/* SLATS
        -----------------------------------------------------------------------------------------*/}
        <Scroller
          vertical={verticalScrolling}
          className={joinClassNames(
            'fc-timegrid-body fc-flex-col',
            verticalScrolling && 'fc-liquid',
          )}
          ref={props.timeScrollerRef}
          clientWidthRef={this.handleClientWidth}
          clientHeightRef={this.handleClientHeight}
          endScrollbarWidthRef={this.handleEndScrollbarWidth}
        >
          <div
            className='fc-rel fc-grow fc-flex-col'
            // in print mode, this div creates the height and everything is absolutely positioned within
            // we need to do this so that slats positioning synces with events's positioning
            // otherwise, get out of sync on second page
            style={{ height: forcedBodyHeight }}
          >
            <TimeGridCols
              dateProfile={props.dateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}
              cells={props.cells}
              slatCnt={slatCnt}
              forPrint={props.forPrint}
              isHitComboAllowed={props.isHitComboAllowed}
              className='fc-fill fc-border-s'
              style={{
                ...axisStartCss,
                height: forcedBodyHeight, // fc-flex-row needs this for print (for Firefox)
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
              slatHeight={slatHeight}
            />

            <div className={joinClassNames(
              'fc-timegrid-slots fc-flex-col',
              verticalScrolling && options.expandRows && 'fc-grow',
              props.forPrint
                ? 'fc-fill-x' // will assume top:0, height will be decided naturally
                : 'fc-rel', // needs abs/rel for zIndex
            )}>
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

            {needsBottomFiller && (
              <div class='fc-liquid fc-border-t fc-filler' />
            )}

            {options.nowIndicator && rangeContainsMarker(props.dateProfile.currentRange, nowDate) && (
              <TimeGridNowIndicatorArrow
                nowDate={nowDate}
                dateProfile={props.dateProfile}
                totalHeight={slatHeight != null ? slatHeight * slatCnt : undefined}
              />
            )}
          </div>
        </Scroller>
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

  private handleAxisInnerWidths = () => {
    const headerLabelInnerWidthMap = this.headerLabelInnerWidthRefMap.current
    const slatLabelInnerWidthMap = this.slatLabelInnerWidthRefMap.current
    let max = this.allDayLabelInnerWidth || 0 // guard against all-day slot hidden

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
