import { Duration, ViewOptions } from '@fullcalendar/core'
import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventRangeProps, EventSegUiInteractionState, Hit, Scroller, SlicedCoordRange, ViewContainer, afterSize, joinClassNames, memoize } from "@fullcalendar/core/internal"
import { createElement, createRef } from '@fullcalendar/core/preact'
import { buildSlatMetas } from "../time-slat-meta.js"
import { TimeGridRange } from '../TimeColsSeg.js'
import { TimeGridLayoutPannable } from './TimeGridLayoutPannable.js'
import { TimeGridLayoutNormal } from './TimeGridLayoutNormal.js'
import { computeTimeTopFrac } from './util.js'
import { RowConfig } from '@fullcalendar/daygrid/internal'

export interface TimeGridLayoutProps {
  labelId: string | undefined
  labelStr: string | undefined

  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  cells: DayTableCell[]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  className: string

  // header content
  headerTiers: RowConfig<{ text: string, isDisabled: boolean }>[]

  // all-day content
  fgEventSegs: (SlicedCoordRange & EventRangeProps)[],
  bgEventSegs: (SlicedCoordRange & EventRangeProps)[],
  businessHourSegs: (SlicedCoordRange & EventRangeProps)[],
  dateSelectionSegs: (SlicedCoordRange & EventRangeProps)[],
  eventDrag: EventSegUiInteractionState<SlicedCoordRange> | null,
  eventResize: EventSegUiInteractionState<SlicedCoordRange> | null,

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

  borderX: boolean
  borderTop: boolean
  borderBottom: boolean
}

interface TimeScroll {
  time?: Duration
  y?: number
}

export class TimeGridLayout extends BaseComponent<TimeGridLayoutProps> {
  // memo
  private buildSlatMetas = memoize(buildSlatMetas)

  // refs
  private dayScrollerRef = createRef<Scroller>()
  private timeScrollerRef = createRef<Scroller>()
  private slatHeight?: number

  // internal
  private currentSlatCnt?: number
  private scrollState: TimeScroll = {} // updated in-place

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
      timeScrollState: this.scrollState,
      slatHeightRef: this.handleSlatHeight,

      borderX: props.borderX,
    }

    return (
      <ViewContainer
        attrs={{
          role: 'grid',
          'aria-colcount': props.cells.length,
          'aria-labelledby': props.labelId,
          'aria-label': props.labelStr,
        }}
        className={joinClassNames(
          !props.forPrint && 'fcu-flex-col',
          props.className,
          // we don't do fcu-print-root/fcu-print-header here because works poorly with print:
          // - Firefox >85ish CAN have flexboxes within it, but those cannot do absolute positioning
          // - Chrome works okay, but abs-positioned events cover the repeated header
          //   Also, there's weird padding on the last page at bottom of container, which matches
          //   the height of the repeated header
          // - Safari was never able to do repeated headers in the first place
        )}
        viewSpec={context.viewSpec}
        borderX={props.borderX}
        borderTop={props.borderTop}
        borderBottom={props.borderBottom}
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
    this.resetScroll()
    this.context.emitter.on('_timeScrollRequest', this.handleTimeScrollRequest)
    this.timeScrollerRef.current.addScrollEndListener(this.handleTimeScrollEnd)
  }

  componentDidUpdate(prevProps: TimeGridLayoutProps) {
    if (prevProps.dateProfile !== this.props.dateProfile && this.context.options.scrollTimeReset) {
      this.resetScroll()
    } else if (prevProps.forPrint && !this.props.forPrint) {
      // returning from print
      // reapply scrolling because scroll-divs were probably restored
      this.applyTimeScroll()
    }
  }

  componentWillUnmount() {
    this.context.emitter.off('_timeScrollRequest', this.handleTimeScrollRequest)
    this.timeScrollerRef.current.removeScrollEndListener(this.handleTimeScrollEnd)
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  private handleSlatHeight = (slatHeight: number | null) => {
    this.slatHeight = slatHeight

    if (slatHeight != null) {
      afterSize(this.applyTimeScroll)
    }
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  private resetScroll() {
    this.handleTimeScrollRequest(this.context.options.scrollTime)

    // also resets day scroll
    const dayScroller = this.dayScrollerRef.current
    if (dayScroller) {
      dayScroller.scrollTo({ x: 0 })
    }
  }

  private handleTimeScrollRequest = (scrollTime: Duration) => {
    this.scrollState.time = scrollTime
    this.scrollState.y = undefined
    this.applyTimeScroll()
  }

  /*
  Captures current values
  */
  private handleTimeScrollEnd = (isUser: boolean) => {
    if (isUser) {
      const y = this.timeScrollerRef.current.y

      // record, but only if not forPrint, which could give bogus values in the case of
      // TimeGridLayoutPannable, which kills y-scrolling, but retains x-scrolling,
      // which reports as a 0 y-scroll.
      if (!this.props.forPrint) {
        this.scrollState.y = y
        this.scrollState.time = undefined
      }
    }
  }

  private applyTimeScroll = () => {
    const timeScroller = this.timeScrollerRef.current
    const { slatHeight, scrollState } = this
    let { y, time } = scrollState

    if (
      y == null &&
      time &&
      slatHeight != null &&
      // Since applyTimeScroll is called by handleSlatHeight, could be called with null during cleanup,
      // and the timeScroller might not exist
      timeScroller
    ) {
      y = computeTimeTopFrac(time, this.props.dateProfile)
        * (slatHeight * this.currentSlatCnt)

      if (y) {
        y++ // overcome top border
      }

      scrollState.y = y // HACK: store raw pixel value
    }

    if (y != null) {
      timeScroller.scrollTo({ y })
    }
  }
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
