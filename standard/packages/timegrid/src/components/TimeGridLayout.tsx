import { Duration, ViewOptions } from '@fullcalendar/core'
import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventSegUiInteractionState, Hit, ScrollResponder, Scroller, ViewContainer, afterSize, memoize } from "@fullcalendar/core/internal"
import { createElement, ComponentChild, Ref, createRef } from '@fullcalendar/core/preact'
import { TableSeg } from '@fullcalendar/daygrid/internal'
import { buildSlatMetas } from "../time-slat-meta.js"
import { TimeColsSeg } from '../TimeColsSeg.js'
import { TimeGridLayoutPannable } from './TimeGridLayoutPannable.js'
import { TimeGridLayoutNormal } from './TimeGridLayoutNormal.js'
import { computeTimeTopFrac } from './util.js'

export interface TimeGridLayoutProps<HeaderCellModel, HeaderCellKey> {
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  cells: DayTableCell[]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  className: string

  // header content
  headerTiers: HeaderCellModel[][]
  renderHeaderLabel: (
    tier: number,
    innerWidthRef: Ref<number>,
    innerHeightRef: Ref<number>,
    width: number | undefined,
  ) => ComponentChild
  renderHeaderContent: (
    model: HeaderCellModel,
    tier: number,
    innerHeightRef: Ref<number>,
    width: number | undefined // TODO: rename to colWidth
  ) => ComponentChild
  getHeaderModelKey: (model: HeaderCellModel) => HeaderCellKey

  // all-day content
  fgEventSegs: TableSeg[],
  bgEventSegs: TableSeg[],
  businessHourSegs: TableSeg[],
  dateSelectionSegs: TableSeg[],
  eventDrag: EventSegUiInteractionState | null,
  eventResize: EventSegUiInteractionState | null,

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
}

export class TimeGridLayout<HeaderCellModel, HeaderCellKey> extends BaseComponent<TimeGridLayoutProps<HeaderCellModel, HeaderCellKey>> {
  // memo
  private buildSlatMetas = memoize(buildSlatMetas)

  // refs
  private dayScrollerRef = createRef<Scroller>()
  private timeScrollerRef = createRef<Scroller>()
  private slatHeight?: number

  // internal
  private currentSlatCnt?: number

  render() {
    const { props, context } = this
    const { dateProfile } = props
    const { options, dateEnv } = context
    const { dayMinWidth } = options

    const slatMetas = this.buildSlatMetas(
      dateProfile.slotMinTime,
      dateProfile.slotMaxTime,
      options.slotLabelInterval,
      options.slotDuration,
      dateEnv,
    )
    this.currentSlatCnt = slatMetas.length

    const commonLayoutProps = {
      dateProfile: dateProfile,
      nowDate: props.nowDate,
      todayRange: props.todayRange,
      cells: props.cells,
      slatMetas,
      forPrint: props.forPrint,
      isHitComboAllowed: props.isHitComboAllowed,

      // header content
      headerTiers: props.headerTiers,
      renderHeaderLabel: props.renderHeaderLabel,
      renderHeaderContent: props.renderHeaderContent,
      getHeaderModelKey: props.getHeaderModelKey,

      // all-day content
      fgEventSegs: props.fgEventSegs,
      bgEventSegs: props.bgEventSegs,
      businessHourSegs: props.businessHourSegs,
      dateSelectionSegs: props.dateSelectionSegs,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize,
      ...getAllDayMaxEventProps(options),

      // timed content
      fgEventSegsByCol: props.fgEventSegsByCol,
      bgEventSegsByCol: props.bgEventSegsByCol,
      businessHourSegsByCol: props.businessHourSegsByCol,
      nowIndicatorSegsByCol: props.nowIndicatorSegsByCol,
      dateSelectionSegsByCol: props.dateSelectionSegsByCol,
      eventDragByCol: props.eventDragByCol,
      eventResizeByCol: props.eventResizeByCol,

      // universal content
      eventSelection: props.eventSelection,

      // refs
      timeScrollerRef: this.timeScrollerRef,
      slatHeightRef: this.handleSlatHeight,
    }

    return (
      <ViewContainer
        elClasses={[
          props.className,
          'fc-flex-column',
          'fc-border'
        ]}
        viewSpec={context.viewSpec}
      >
        {dayMinWidth ? (
          <TimeGridLayoutPannable
            {...commonLayoutProps}
            dayMinWidth={dayMinWidth}
            dayScrollerRef={this.dayScrollerRef}
          />
        ) : (
          <TimeGridLayoutNormal {...commonLayoutProps} />
        )}
      </ViewContainer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    const { context } = this
    const { options } = context

    context.emitter.on('_timeScrollRequest', this.timeScrollResponder.handleScroll)
    this.timeScrollResponder.handleScroll(options.scrollTime)
  }

  componentDidUpdate(prevProps: TimeGridLayoutProps<unknown, unknown>) {
    const { options } = this.context

    if (prevProps.dateProfile !== this.props.dateProfile && options.scrollTimeReset) {
      this.timeScrollResponder.handleScroll(options.scrollTime)
    } else {
      this.handleSize()
    }
  }

  componentWillUnmount() {
    this.context.emitter.off('_timeScrollRequest', this.timeScrollResponder.handleScroll)
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  private handleSlatHeight = (slatHeight: number) => {
    this.slatHeight = slatHeight
    afterSize(this.handleSize)
  }

  private handleSize = () => {
    this.timeScrollResponder.drain()
  }

  private timeScrollResponder = new ScrollResponder((time: Duration) => {
    const dayScroller = this.dayScrollerRef.current
    const timeScroller = this.timeScrollerRef.current
    const { slatHeight } = this

    if (slatHeight != null) {
      let top = computeTimeTopFrac(time, this.props.dateProfile)
        * (slatHeight * this.currentSlatCnt)
        + (this.context.isRtl ? -1 : 1) // overcome border

      if (top) {
        top++ // overcome top border
      }

      timeScroller.scrollTo({ y: top })

      // HACK to scroll to day
      if (dayScroller) {
        dayScroller.scrollTo({ x: 0 })
      }

      return true
    }

    return false
  })
}

// Utils
// -----------------------------------------------------------------------------------------------

const AUTO_ALL_DAY_MAX_EVENT_ROWS = 5

function getAllDayMaxEventProps(options: ViewOptions) {
  let { dayMaxEvents, dayMaxEventRows } = options

  if (dayMaxEvents === true || dayMaxEventRows === true) { // is auto?
    dayMaxEvents = undefined
    dayMaxEventRows = AUTO_ALL_DAY_MAX_EVENT_ROWS // make sure "auto" goes to a real number
  }

  return { dayMaxEvents, dayMaxEventRows }
}
