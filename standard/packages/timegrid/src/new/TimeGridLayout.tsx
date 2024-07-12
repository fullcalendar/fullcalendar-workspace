import { Duration, ViewOptions } from '@fullcalendar/core'
import { BaseComponent, DateMarker, DateProfile, DateRange, DayTableCell, EventSegUiInteractionState, ScrollController2, ViewContainer, memoize } from "@fullcalendar/core/internal"
import { createElement, ComponentChild, createRef } from '@fullcalendar/core/preact'
import { DayGridRowProps, TableSeg } from '@fullcalendar/daygrid/internal'
import { buildSlatMetas } from "../time-slat-meta.js"
import { TimeGridColsProps } from "./TimeGridCols.js"
import { TimeColsSeg } from '../TimeColsSeg.js'
import { TimeGridLayoutPannable } from './TimeGridLayoutPannable.js'
import { TimeGridLayoutNormal } from './TimeGridLayoutNormal.js'

export interface TimeGridLayoutProps<HeaderCellModel, HeaderCellKey> {
  cells: DayTableCell[] // just the ONE row
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  eventSelection: string,

  headerTiers: HeaderCellModel[][]
  renderHeaderLabel: (tier: number, handleEl: (el: HTMLElement) => void, height: number) => ComponentChild
  renderHeaderContent: (model: HeaderCellModel, tier: number, handleEl: (el: HTMLElement) => void) => ComponentChild
  getHeaderModelKey: (model: HeaderCellModel) => HeaderCellKey

  // for all-day
  fgEventSegs: TableSeg[],
  bgEventSegs: TableSeg[],
  businessHourSegs: TableSeg[],
  dateSelectionSegs: TableSeg[],
  eventDrag: EventSegUiInteractionState | null,
  eventResize: EventSegUiInteractionState | null,

  // for timed
  fgEventSegsByCol: TimeColsSeg[][]
  bgEventSegsByCol: TimeColsSeg[][]
  businessHourSegsByCol: TimeColsSeg[][]
  nowIndicatorSegsByCol: TimeColsSeg[][] // only for timed
  dateSelectionSegsByCol: TimeColsSeg[][]
  eventDragByCol: EventSegUiInteractionState[]
  eventResizeByCol: EventSegUiInteractionState[]

  isHeightAuto: boolean
  forPrint: boolean
}

export class TimeGridLayout<HeaderCellModel, HeaderCellKey> extends BaseComponent<TimeGridLayoutProps<HeaderCellModel, HeaderCellKey>> {
  private buildSlatMetas = memoize(buildSlatMetas)

  private scrollControllerRef = createRef<ScrollController2>()
  private slatHeightRef = createRef<number>()

  render() {
    const { props, state, context } = this
    const { dateProfile, nowDate, todayRange } = props
    const { options, dateEnv } = context
    const { dayMinWidth } = options

    const slatMetas = this.buildSlatMetas(
      dateProfile.slotMinTime,
      dateProfile.slotMaxTime,
      options.slotLabelInterval,
      options.slotDuration,
      dateEnv,
    )

    const dayGridRowProps: DayGridRowProps = {
      cells: props.cells,
      businessHourSegs: props.businessHourSegs,
      bgEventSegs: props.bgEventSegs,
      fgEventSegs: props.fgEventSegs,
      dateSelectionSegs: props.dateSelectionSegs,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize,
      ...getAllDayMaxEventProps(options),
      dateProfile: dateProfile,
      todayRange: todayRange,
      showDayNumbers: false,
      showWeekNumbers: false,
      forPrint: props.forPrint,
      colWidth: undefined,
    }

    const timeGridColsProps: TimeGridColsProps = {
      cells: props.cells,
      dateProfile: dateProfile,
      nowDate: nowDate,
      todayRange: todayRange,
      fgEventSegsByCol: props.fgEventSegsByCol,
      bgEventSegsByCol: props.bgEventSegsByCol,
      businessHourSegsByCol: props.businessHourSegsByCol,
      nowIndicatorSegsByCol: props.nowIndicatorSegsByCol,
      dateSelectionSegsByCol: props.dateSelectionSegsByCol,
      eventDragByCol: props.eventDragByCol,
      eventResizeByCol: props.eventResizeByCol,
      eventSelection: props.eventSelection,
      slatHeight: state.slatHeight,
      colCoords: undefined,
      forPrint: props.forPrint,
    }

    return (
      <ViewContainer elClasses={['fc-timegrid']} viewSpec={context.viewSpec}>
        {dayMinWidth ? (
          <TimeGridLayoutPannable
            scrollControllerRef={this.scrollControllerRef}
            slatHeightRef={this.slatHeightRef}
            cells={props.cells}
            nowDate={props.nowDate}
            headerTiers={props.headerTiers}
            renderHeaderLabel={props.renderHeaderLabel}
            renderHeaderContent={props.renderHeaderContent}
            getHeaderModelKey={props.getHeaderModelKey}
            dayGridRowProps={dayGridRowProps}
            timeGridColsProps={timeGridColsProps}
            slatMetas={slatMetas}
            isHeightAuto={props.isHeightAuto}
            dayMinWidth={dayMinWidth}
          />
        ) : (
          <TimeGridLayoutNormal
            scrollControllerRef={this.scrollControllerRef}
            slatHeightRef={this.slatHeightRef}
            cells={props.cells}
            nowDate={props.nowDate}
            headerTiers={props.headerTiers}
            renderHeaderLabel={props.renderHeaderLabel}
            renderHeaderContent={props.renderHeaderContent}
            getHeaderModelKey={props.getHeaderModelKey}
            dayGridRowProps={dayGridRowProps}
            timeGridColsProps={timeGridColsProps}
            slatMetas={slatMetas}
          />
        )}
      </ViewContainer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this.handleScroll(this.context.options.scrollTime)
    this.context.emitter.on('_scrollRequest', this.handleScroll)
  }

  componentDidUpdate(prevProps: TimeGridLayoutProps<unknown, unknown>) {
    if (
      prevProps.dateProfile !== this.props.dateProfile &&
      this.context.options.scrollTimeReset
    ) {
      const scrollController = this.scrollControllerRef.current

      if (scrollController) {
        scrollController.scrollTo({ x: 0 })
      }
    }
  }

  componentWillUnmount() {
    this.context.emitter.off('_scrollRequest', this.handleScroll)
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  // TODO: emulate applyTimeScroll system that ResourceTimelineView does!

  handleScroll = (time: Duration) => {
    if (time) {
      const scrollController = this.scrollControllerRef.current
      const slatHeight = this.slatHeightRef.current

      if (scrollController && slatHeight) {
        const top = slatHeight * Math.random() // TODO: somehow use slatHeight
        scrollController.scrollTo({ y: top })
      }
    }
  }
}

const AUTO_ALL_DAY_MAX_EVENT_ROWS = 5

function getAllDayMaxEventProps(options: ViewOptions) {
  let { dayMaxEvents, dayMaxEventRows } = options

  if (dayMaxEvents === true || dayMaxEventRows === true) { // is auto?
    dayMaxEvents = undefined
    dayMaxEventRows = AUTO_ALL_DAY_MAX_EVENT_ROWS // make sure "auto" goes to a real number
  }

  return { dayMaxEvents, dayMaxEventRows }
}
