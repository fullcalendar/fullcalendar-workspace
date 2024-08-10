import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventSegUiInteractionState, Hit, Scroller, ScrollerInterface, RefMap, getStickyHeaderDates, setRef, afterSize, getIsHeightAuto, rangeContainsMarker } from "@fullcalendar/core/internal"
import { Fragment, createElement, ComponentChild, Ref } from '@fullcalendar/core/preact'
import { HeaderRow, TableSeg } from '@fullcalendar/daygrid/internal'
import { TimeGridAllDayLabel } from "./TimeGridAllDayLabel.js"
import { TimeGridAllDayLane } from "./TimeGridAllDayLane.js"
import { TimeGridNowIndicatorArrow } from "./TimeGridNowIndicatorArrow.js"
import { TimeSlatMeta } from "../time-slat-meta.js"
import { TimeGridSlatLabel } from "./TimeGridSlatLabel.js"
import { TimeGridSlatLane } from "./TimeGridSlatLane.js"
import { TimeGridCols } from "./TimeGridCols.js"
import { TimeColsSeg } from "../TimeColsSeg.js"
import { computeSlatHeight } from "./util.js"

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
  timeScrollerRef?: Ref<ScrollerInterface>
  slatHeightRef?: Ref<number>
}

interface TimeGridLayoutState {
  scrollerHeight?: number
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
  private currentSlatHeight?: number

  render() {
    const { props, state, context, slatLabelInnerWidthRefMap, slatLabelInnerHeightRefMap, slatInnerMainHeightRefMap, headerLabelInnerWidthRefMap } = this
    const { nowDate } = props
    const { axisWidth } = state
    const { options } = context

    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    const verticalScrolling = !props.forPrint && !getIsHeightAuto(options)

    const slatCnt = props.slatMetas.length
    const [slatHeight, slatLiquid] = computeSlatHeight(
      verticalScrolling,
      options.expandRows,
      slatCnt,
      state.slatInnerHeight,
      state.scrollerHeight,
    )
    const slatStyleHeight = slatLiquid ? '' : slatHeight

    if (this.currentSlatHeight !== slatHeight) {
      this.currentSlatHeight = slatHeight
      setRef(props.slatHeightRef, slatHeight)
    }

    return (
      <Fragment>
        <div
          className='fcnew-rowgroup' // contains other rows/rowgroups
          style={{
            paddingLeft: state.leftScrollbarWidth,
            paddingRight: state.rightScrollbarWidth,
          }}
        >
          {/* HEADER
          ---------------------------------------------------------------------------------------*/}
          {options.dayHeaders && (
            <div className={[
              'fcnew-rowgroup',
              stickyHeaderDates ? 'fcnew-sticky' : '',
            ].join(' ')}>
              {props.headerTiers.map((cells, tierNum) => (
                <div
                  key={tierNum}
                  className='fcnew-row'
                >
                  {props.renderHeaderLabel( // .fcnew-rowheader
                    tierNum,
                    headerLabelInnerWidthRefMap.createRef(tierNum), // innerWidthRef
                    undefined, // innerHeightRef
                    axisWidth, // width
                  )}
                  <HeaderRow // .fcnew-cellgroup
                    tierNum={tierNum}
                    cells={cells}
                    renderHeaderContent={props.renderHeaderContent}
                    getHeaderModelKey={props.getHeaderModelKey}
                    cellGroup
                  />
                </div>
              ))}
            </div>
          )}
          {/* ALL-DAY
          ---------------------------------------------------------------------------------------*/}
          {options.allDaySlot && (
            <Fragment>
              <div className='fcnew-row'>
                <TimeGridAllDayLabel // .fcnew-rowheader
                  width={axisWidth}
                  innerWidthRef={this.handleAllDayLabelInnerWidth}
                />
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
                  eventDrag={props.eventDrag}
                  eventResize={props.eventResize}
                  eventSelection={props.eventSelection}
                  dayMaxEvents={props.dayMaxEvents}
                  dayMaxEventRows={props.dayMaxEventRows}
                />
              </div>
              <div className='fcnew-rowdivider'></div>
            </Fragment>
          )}
        </div>
        {/* SLATS
        -----------------------------------------------------------------------------------------*/}
        <Scroller
          vertical={verticalScrolling}
          elClassNames={['fcnew-rowgroup', 'fcnew-timegrid-timed-main']}
          ref={props.timeScrollerRef}
          heightRef={this.handleScrollerHeight}
          leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
          rightScrollbarWidthRef={this.handleRightScrollbarWidth}
        >
          <div
            className='fcnew-rel'
            style={{ minHeight: slatLiquid ? '100%' : '' }} // TODO: use className for this?
          >
            {props.slatMetas.map((slatMeta) => (
              <div
                key={slatMeta.key}
                className='fcnew-row'
                style={{ height: slatStyleHeight }}
              >
                <TimeGridSlatLabel // .fcnew-rowheader
                  {...slatMeta}
                  innerWidthRef={slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                  innerHeightRef={slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
                  width={axisWidth}
                />
                <TimeGridSlatLane // .fcnew-cell
                  {...slatMeta}
                  innerHeightRef={slatInnerMainHeightRefMap.createRef(slatMeta.key)}
                />
              </div>
            ))}
            {/* TODO: fix problem with last-child always showing border! */}
            <div className='fcnew-absfill fcnew-cellgroup'>
              <div style={{ width: axisWidth }}>
                {rangeContainsMarker(props.dateProfile.currentRange, nowDate) && (
                  <TimeGridNowIndicatorArrow
                    nowDate={nowDate}
                    dateProfile={props.dateProfile}
                  />
                )}
              </div>
              <TimeGridCols // .fcnew-cellgroup
                dateProfile={props.dateProfile}
                nowDate={props.nowDate}
                todayRange={props.todayRange}
                cells={props.cells}
                slatCnt={slatCnt}
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
                slatHeight={slatHeight}
              />
            </div>
          </div>
        </Scroller>
      </Fragment>
    )
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  private handleScrollerHeight = (scrollerHeight: number) => {
    this.setState({ scrollerHeight })
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
    let max = this.allDayLabelInnerWidth

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
