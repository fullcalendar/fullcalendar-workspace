import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventSegUiInteractionState, Hit, Scroller, ScrollerInterface, RefMapKeyed, getStickyHeaderDates, setRef } from "@fullcalendar/core/internal"
import { Fragment, createElement, createRef, ComponentChild, Ref } from '@fullcalendar/core/preact'
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
  scrollerRef?: Ref<ScrollerInterface>
  slatHeightRef?: Ref<number>
}

interface TimeGridLayoutState {
  width?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
  axisWidth?: number
  slatHeight?: number
}

export class TimeGridLayoutNormal<HeaderCellModel, HeaderCellKey> extends BaseComponent<TimeGridLayoutNormalProps<HeaderCellModel, HeaderCellKey>, TimeGridLayoutState> {
  // refs
  private headerLabelElRefMap = new RefMapKeyed<number, HTMLElement>()
  private allDayLabelElRef = createRef<HTMLElement>()
  private slatLabelElRefMap = new RefMapKeyed<string, HTMLElement>() // keyed by ISO-something
  private slatContentElRefMap = new RefMapKeyed<string, HTMLElement>() // keyed by ISO-something

  render() {
    const { props, state, context } = this
    const { nowDate } = props
    const { axisWidth } = state
    const { options } = context
    const stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)

    return (
      <Fragment>
        {options.dayHeaders && (
          <div className={[
            'fcnew-header',
            stickyHeaderDates && 'fcnew-sticky',
          ].join(' ')}>
            <div className='fcnew-header-inner'>
              {props.headerTiers.map((models, tierNum) => (
                <div className='fcnew-row'>
                  {props.renderHeaderLabel(
                    tierNum,
                    this.headerLabelElRefMap.createRef(tierNum),
                    undefined,
                  )}
                  {models.map((model) => (
                    props.renderHeaderContent(
                      model,
                      tierNum,
                      undefined, // ref
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
                  elRef={this.allDayLabelElRef}
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
        <Scroller
          ref={props.scrollerRef}
          vertical
        >
          <div className='fcnew-canvas'>
            <div>
              {props.slatMetas.map((slatMeta) => (
                <div className='fcnew-row'>
                  <div style={{ width: axisWidth }}>
                    <TimeGridAxisCell
                      {...slatMeta}
                      elRef={this.slatLabelElRefMap.createRef(slatMeta.key)}
                    />
                  </div>
                  <TimeGridSlatCell
                    slatMeta={slatMeta}
                    elRef={this.slatContentElRefMap.createRef(slatMeta.key)}
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

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this.handleSizing()
    this.context.addResizeHandler(this.handleSizing)
  }

  componentDidUpdate(prevProps: unknown, prevState: TimeGridLayoutState) {
    this.handleSizing()

    if (this.state.slatHeight !== prevState.slatHeight && this.props.onTimeCoords) {
      this.props.onTimeCoords()
    }
  }

  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
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

    this.safeSetState({
      axisWidth: maxAxisElWidth
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
    this.safeSetState({ slatHeight })
    setRef(this.props.slatHeightRef, slatHeight)
  }

  handleWidth = (width: number) => {
    this.setState({ width})
  }

  handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({ leftScrollbarWidth })
  }

  handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({ rightScrollbarWidth })
  }
}
