import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventSegUiInteractionState, Hit, Scroller, ScrollerInterface, RefMap, getStickyHeaderDates, setRef, afterSize } from "@fullcalendar/core/internal"
import { Fragment, createElement, ComponentChild, Ref } from '@fullcalendar/core/preact'
import { TableSeg } from '@fullcalendar/daygrid/internal'
import { TimeGridAllDayLabelCell } from "./TimeGridAllDayLabelCell.js"
import { TimeGridAllDayContent } from "./TimeGridAllDayContent.js"
import { TimeGridNowIndicatorArrow } from "./TimeGridNowIndicatorArrow.js"
import { TimeSlatMeta } from "../time-slat-meta.js"
import { TimeGridAxisCell } from "./TimeGridAxisCell.js"
import { TimeGridSlatCell } from "./TimeGridSlatCell.js"
import { TimeGridCols } from "./TimeGridCols.js"
import { TimeColsSeg } from "../TimeColsSeg.js"

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
  scrollerRef?: Ref<ScrollerInterface>
  slatHeightRef?: Ref<number>
}

interface TimeGridLayoutState {
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
  axisWidth?: number
  slatHeight?: number
}

export class TimeGridLayoutNormal<HeaderCellModel, HeaderCellKey> extends BaseComponent<TimeGridLayoutNormalProps<HeaderCellModel, HeaderCellKey>, TimeGridLayoutState> {
  // refs
  private headerLabelInnerWidthRefMap = new RefMap<number, number>(() => { // keyed by tierNum
    afterSize(this.handleAxisWidths)
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
    afterSize(this.handleSlatHeights)
  })
  private slatInnerHeightRefMap = new RefMap<string, number>(() => { // keyed by slatMeta.key
    afterSize(this.handleSlatHeights)
  })

  render() {
    const { props, state, context, slatLabelInnerWidthRefMap, slatLabelInnerHeightRefMap, slatInnerHeightRefMap, headerLabelInnerWidthRefMap } = this
    const { nowDate } = props
    const { axisWidth } = state
    const { options } = context
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)

    return (
      <Fragment>
        <div style={{ paddingLeft: state.leftScrollbarWidth, paddingRight: state.rightScrollbarWidth }}>
          {options.dayHeaders && (
            <div className={[
              'fcnew-header',
              stickyHeaderDates ? 'fcnew-sticky' : '',
            ].join(' ')}>
              <div className='fcnew-header-inner'>
                {props.headerTiers.map((models, tierNum) => (
                  <div className='fcnew-row'>
                    {props.renderHeaderLabel(
                      tierNum,
                      headerLabelInnerWidthRefMap.createRef(tierNum), // innerWidthRef
                      undefined, // innerHeightRef
                      axisWidth, // width
                      undefined, // height
                    )}
                    {models.map((model) => (
                      props.renderHeaderContent( // TODO: add key!!!!!!!
                        model,
                        tierNum,
                        undefined, // innerHeightRef
                        undefined, // height
                      )
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {options.allDaySlot && (
            <Fragment>
              <div className='fcnew-row'>
                <div className='fcnew-col' style={{ width: axisWidth }}>
                  <TimeGridAllDayLabelCell
                    width={axisWidth /* AAHHHH -- defined in two places */}
                    height={undefined}
                    innerWidthRef={this.handleAllDayLabelInnerWidth}
                  />
                </div>
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
                />
              </div>
              <div className='fcnew-divider'></div>
            </Fragment>
          )}
        </div>
        <Scroller
          vertical
          ref={props.scrollerRef}
          leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
          rightScrollbarWidthRef={this.handleRightScrollbarWidth}
        >
          <div className='fcnew-canvas'>
            <div>
              {props.slatMetas.map((slatMeta) => (
                <div className='fcnew-row'>
                  <div style={{ width: axisWidth }}>
                    <TimeGridAxisCell
                      {...slatMeta}
                      innerWidthRef={slatLabelInnerWidthRefMap.createRef(slatMeta.key)}
                      innerHeightRef={slatLabelInnerHeightRefMap.createRef(slatMeta.key)}
                    />
                  </div>
                  <TimeGridSlatCell
                    {...slatMeta}
                    innerHeightRef={slatInnerHeightRefMap.createRef(slatMeta.key)}
                  />
                </div>
              ))}
            </div>
            <div className='fcnew-absolute'>
              <div style={{ width: axisWidth }}>{/* TODO: make TimeGridAxisCol ? */}
                <TimeGridNowIndicatorArrow nowDate={nowDate} />
              </div>
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
                slatHeight={state.slatHeight}
              />
            </div>
          </div>
        </Scroller>
      </Fragment>
    )
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  private handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({ leftScrollbarWidth })
  }

  private handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({ rightScrollbarWidth })
  }

  private handleAxisWidths = () => {
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

  private handleSlatHeights = () => {
    const slatLabelInnerHeightMap = this.slatLabelInnerHeightRefMap.current
    const slatInnerHeightMap = this.slatInnerHeightRefMap.current
    let max = 0

    for (const slatLabelInnerHeight of slatLabelInnerHeightMap.values()) {
      max = Math.max(max, slatLabelInnerHeight)
    }

    for (const slatInnerHeight of slatInnerHeightMap.values()) {
      max = Math.max(max, slatInnerHeight)
    }

    if (this.state.slatHeight !== max) {
      this.setState({ slatHeight: max })
      setRef(this.props.slatHeightRef, max)
    }
  }
}
