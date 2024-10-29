import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventSegUiInteractionState, Hit, Scroller, ScrollerInterface, RefMap, getStickyHeaderDates, setRef, afterSize, getIsHeightAuto, rangeContainsMarker, SlicedCoordRange, EventRangeProps, joinClassNames } from "@fullcalendar/core/internal"
import { Fragment, createElement, ComponentChild, Ref } from '@fullcalendar/core/preact'
import { HeaderRow, COMPACT_CELL_WIDTH } from '@fullcalendar/daygrid/internal'
import { TimeGridAllDayLabel } from "./TimeGridAllDayLabel.js"
import { TimeGridAllDayLane } from "./TimeGridAllDayLane.js"
import { TimeGridNowIndicatorArrow } from "./TimeGridNowIndicatorArrow.js"
import { TimeSlatMeta } from "../time-slat-meta.js"
import { TimeGridSlatLabel } from "./TimeGridSlatLabel.js"
import { TimeGridSlatLane } from "./TimeGridSlatLane.js"
import { TimeGridCols } from "./TimeGridCols.js"
import { TimeGridRange } from "../TimeColsSeg.js"
import { computeSlatHeight, getSlatRowClassNames } from './util.js'

export interface TimeGridLayoutNormalProps<HeaderCellModel, HeaderCellKey> {
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  cells: DayTableCell[]
  slatMetas: TimeSlatMeta[],
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // header content
  headerTiers: HeaderCellModel[][]
  renderHeaderLabel: (
    tier: number,
    innerWidthRef: Ref<number> | undefined,
    innerHeightRef: Ref<number> | undefined, // unused
    width: number | undefined,
  ) => ComponentChild
  renderHeaderContent: (
    model: HeaderCellModel,
    tier: number,
    innerHeightRef: Ref<number> | undefined, // unused
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
  timeScrollerRef?: Ref<ScrollerInterface>
  slatHeightRef?: Ref<number>
}

interface TimeGridLayoutState {
  clientWidth?: number
  clientHeight?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
  axisWidth?: number
  slatInnerHeight?: number
}

export class TimeGridLayoutNormal<HeaderCellModel, HeaderCellKey> extends BaseComponent<TimeGridLayoutNormalProps<HeaderCellModel, HeaderCellKey>, TimeGridLayoutState> {
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

    return (
      <Fragment>
        {/* HEADER
        ---------------------------------------------------------------------------------------*/}
        {options.dayHeaders && (
          <div
            className={joinClassNames(
              'fc-timegrid-header fc-table-header',
              stickyHeaderDates && 'fc-table-header-sticky',
            )}
            style={{
              paddingLeft: state.leftScrollbarWidth,
              paddingRight: state.rightScrollbarWidth,
            }}
          >
            {props.headerTiers.map((cells, tierNum) => (
              <div
                key={tierNum}
                className='fc-row'
              >
                {props.renderHeaderLabel( // .fc-cell
                  tierNum,
                  headerLabelInnerWidthRefMap.createRef(tierNum), // innerWidthRef
                  undefined, // innerHeightRef
                  axisWidth, // width
                )}
                <HeaderRow
                  tierNum={tierNum}
                  cells={cells}
                  renderHeaderContent={props.renderHeaderContent}
                  getHeaderModelKey={props.getHeaderModelKey}
                  cellGroup
                  className='fc-cell fc-liquid'
                  // ^weird we're setting 'cell' ... just have HeaderRow be HeaderCells and wrap ourselves?
                />
              </div>
            ))}
          </div>
        )}
        {/* ALL-DAY
        ---------------------------------------------------------------------------------------*/}
        {options.allDaySlot && (
          <div className='fc-timegrid-allday'>{/* TODO: role="rowgroup" will here. we omit fc-table-body to avoid top-border on next fc-table-body */}
            <div
              className='fc-row'
              style={{
                paddingLeft: state.leftScrollbarWidth,
                paddingRight: state.rightScrollbarWidth,
              }}
            >
              <TimeGridAllDayLabel // .fc-cell
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
                className='fc-liquid fc-cell'
                isCompact={
                  (state.clientWidth != null && state.axisWidth != null)
                    && (state.clientWidth - state.axisWidth) / props.cells.length < COMPACT_CELL_WIDTH
                }

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
            </div>
            <div className='fc-rowdivider'></div>
          </div>
        )}
        {/* SLATS
        -----------------------------------------------------------------------------------------*/}
        <Scroller
          vertical={verticalScrolling}
          className={joinClassNames(
            'fc-timegrid-body fc-table-body',
            verticalScrolling && 'fc-liquid',
          )}
          ref={props.timeScrollerRef}
          clientWidthRef={this.handleClientWidth}
          clientHeightRef={this.handleClientHeight}
          leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
          rightScrollbarWidthRef={this.handleRightScrollbarWidth}
        >
          <div className='fc-flex-column fc-grow fc-rel'>
            {/* fc-timegrid-slots is purely for tests/old-print-view. remove somehow? */}
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
                  <TimeGridSlatLabel // .fc-cell
                    {...slatMeta}
                    innerWidthRef={slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                    innerHeightRef={slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
                    width={axisWidth}
                  />
                  <TimeGridSlatLane // .fc-cell
                    {...slatMeta}
                    innerHeightRef={slatInnerMainHeightRefMap.createRef(slatMeta.key)}
                  />
                </div>
              ))}
            </div>
            <div className='fc-fill fc-flex-row'>
              <div
                className='fc-cell fc-content-box'
                style={{ width: axisWidth }}
              >
                {options.nowIndicator && rangeContainsMarker(props.dateProfile.currentRange, nowDate) && (
                  <TimeGridNowIndicatorArrow
                    nowDate={nowDate}
                    dateProfile={props.dateProfile}
                  />
                )}
              </div>
              <TimeGridCols
                dateProfile={props.dateProfile}
                nowDate={props.nowDate}
                todayRange={props.todayRange}
                cells={props.cells}
                slatCnt={slatCnt}
                forPrint={props.forPrint}
                isHitComboAllowed={props.isHitComboAllowed}
                className='fc-liquid fc-cell'

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

  private handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({ leftScrollbarWidth })
  }

  private handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({ rightScrollbarWidth })
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
