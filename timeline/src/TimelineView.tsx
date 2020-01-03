import {
  h, createRef,
  Hit, View, ViewProps, ComponentContext, Duration, memoize, subrenderer, ViewSpec, getViewClassNames, ChunkContentCallbackArgs
} from '@fullcalendar/core'
import TimelineLane from './TimelineLane'
import { buildTimelineDateProfile, TimelineDateProfile } from './timeline-date-profile'
import TimelineHeader, { computeDefaultSlotWidth } from './TimelineHeader'
import TimelineSlats from './TimelineSlats'
import TimelineNowIndicator, { getTimelineNowIndicatorUnit } from './TimelineNowIndicator'
import { ScrollGrid } from '@fullcalendar/scrollgrid'


interface TimelineViewState {
  slotMinWidth: number
}

export default class TimelineView extends View<TimelineViewState> {

  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private registerInteractive = subrenderer(this._registerInteractive, this._unregisterInteractive)
  private renderLane = subrenderer(TimelineLane)
  private renderNowIndicatorMarkers = subrenderer(TimelineNowIndicator)
  private scrollGridRef = createRef<ScrollGrid>()
  private headerScrollerElRef = createRef<HTMLDivElement>()
  private slatsRef = createRef<TimelineSlats>()
  private laneRootElRef = createRef<HTMLDivElement>()
  private laneFgElRef = createRef<HTMLDivElement>()
  private laneBgElRef = createRef<HTMLDivElement>()
  private lane: TimelineLane
  private tDateProfile: TimelineDateProfile


  render(props: ViewProps, state: {}, context: ComponentContext) {
    let { options } = context
    let { dateProfile } = props

    let tDateProfile = this.tDateProfile = this.buildTimelineDateProfile(
      dateProfile,
      context.dateEnv,
      options,
      props.dateProfileGenerator
    )

    let classNames = getTimelineViewClassNames(props.viewSpec, options.eventOverlap)
    let slatCols = buildSlatCols(tDateProfile, this.state.slotMinWidth)

    return (
      <div class={classNames.join(' ')}>
        <ScrollGrid
          ref={this.scrollGridRef}
          colGroups={[
            { cols: slatCols }
          ]}
          sections={[
            {
              type: 'head',
              className: 'fc-head',
              chunks: [{
                scrollerElRef: this.headerScrollerElRef,
                scrollerClassName: 'fc-time-area',
                rowContent: (
                  <TimelineHeader
                    dateProfile={dateProfile}
                    tDateProfile={tDateProfile}
                  />
                )
              }]
            },
            {
              type: 'body',
              className: 'fc-body',
              chunks: [{
                scrollerClassName: 'fc-time-area',
                content: (contentArg: ChunkContentCallbackArgs) => {
                  return (
                    <div class='fc-scroller-canvas' ref={this.laneRootElRef}>
                      <div class='fc-content' ref={this.laneFgElRef} />
                      <div class='fc-bg' ref={this.laneBgElRef}>
                        <TimelineSlats
                          ref={this.slatsRef}
                          dateProfile={dateProfile}
                          tDateProfile={tDateProfile}
                          colGroupNode={contentArg.colGroupNode}
                          minWidth={contentArg.minWidth}
                        />
                      </div>
                    </div>
                  )
                }
              }]
            }
          ]}
        />
      </div>
    )
  }


  componentDidMount() {
    this.subrender()
    this.resize()
    this.startNowIndicator()
    this.scrollToInitialTime()
  }


  componentDidUpdate(prevProps: ViewProps, prevState: {}, snapshot) {
    this.subrender()
    this.resize()

    if (prevProps.dateProfile !== this.props.dateProfile) {
      this.scrollToInitialTime()
    }
  }


  componentWillUnmount() {
    this.stopNowIndicator()
    this.subrenderDestroy()
  }


  subrender() {
    this.lane = this.renderLane({
      ...this.props,
      tDateProfile: this.tDateProfile,
      nextDayThreshold: this.context.nextDayThreshold,
      fgContainerEl: this.laneFgElRef.current,
      bgContainerEl: this.laneBgElRef.current
    })

    this.registerInteractive({
      canvasRoot: this.laneRootElRef.current
    })
  }


  _registerInteractive(props: { canvasRoot: HTMLElement }, context: ComponentContext) {
    context.calendar.registerInteractiveComponent(this, {
      el: props.canvasRoot
    })
  }


  _unregisterInteractive(funcState: void, context: ComponentContext) {
    context.calendar.unregisterInteractiveComponent(this)
  }


  resize(isResize?: boolean) { // !!!!!
    let { lane } = this
    let slats = this.slatsRef.current

    slats.buildPositionCaches()
    lane.computeSizes(isResize, slats)
    lane.assignSizes(isResize, slats)

    this.setState({
      slotMinWidth: this.computeSlotMinWidth()
    })
  }


  computeSlotMinWidth() {
    let slotWidth = this.context.options.slotWidth || ''

    if (slotWidth === '') {
      slotWidth = computeDefaultSlotWidth(this.headerScrollerElRef.current, this.tDateProfile)
    }

    return slotWidth
  }


  // Now Indicator
  // ------------------------------------------------------------------------------------------


  getNowIndicatorUnit() {
    return getTimelineNowIndicatorUnit(this.tDateProfile)
  }


  renderNowIndicator(date) {
    this.renderNowIndicatorMarkers({
      headParentEl: this.headerScrollerElRef.current,
      bodyParentEl: this.laneRootElRef.current,
      tDateProfile: this.tDateProfile,
      slats: this.slatsRef.current,
      date
    })
  }


  unrenderNowIndicator() {
    this.renderNowIndicatorMarkers(false)
  }


  // Scroll System
  // ------------------------------------------------------------------------------------------


  scrollToTime(duration: Duration) {
    this.afterSizing(() => { // hack
      let slats = this.slatsRef.current
      let left = slats.computeDurationLeft(duration) // WONT WORK WITH RTL I DONT THINK

      this.scrollLeft(left)
    })
  }


  scrollLeft(left: number) {
    this.afterSizing(() => { // hack
      this.scrollGridRef.current.setColScrollLeft(0, left)
    })
  }


  // Hit System
  // ------------------------------------------------------------------------------------------


  buildPositionCaches() {
    let slats = this.slatsRef.current

    slats.buildPositionCaches()
  }


  queryHit(positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit {
    let slats = this.slatsRef.current
    let slatHit = slats.positionToHit(positionLeft)

    if (slatHit) {
      return {
        component: this,
        dateSpan: slatHit.dateSpan,
        rect: {
          left: slatHit.left,
          right: slatHit.right,
          top: 0,
          bottom: elHeight
        },
        dayEl: slatHit.dayEl,
        layer: 0
      }
    }
  }

}


export function getTimelineViewClassNames(viewSpec: ViewSpec, eventOverlap) {
  let classNames = getViewClassNames(viewSpec).concat('fc-timeline')

  if (eventOverlap === false) {
    classNames.push('fc-no-overlap')
  }

  return classNames
}


export function buildSlatCols(tDateProfile: TimelineDateProfile, slotMinWidth?: number) {
  let colCnt = tDateProfile.slotCnt
  let cols = []

  for (let i = 0; i < colCnt; i++) {
    cols.push({
      minWidth: slotMinWidth || ''
    })
  }

  return cols
}
