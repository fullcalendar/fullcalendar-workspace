import {
  h, createRef,
  Hit, View, ViewProps, ComponentContext, Duration, memoize, subrenderer, ViewSpec, getViewClassNames, ChunkContentCallbackArgs, componentNeedsResize, NowTimer, DateMarker
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

const STATE_IS_SIZING = {
  slotMinWidth: true
}


export default class TimelineView extends View<TimelineViewState> {

  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private registerInteractive = subrenderer(this._registerInteractive, this._unregisterInteractive)
  private renderLane = subrenderer(TimelineLane)
  private renderNowIndicator = subrenderer(TimelineNowIndicator)
  private scrollGridRef = createRef<ScrollGrid>()
  private headerScrollerElRef = createRef<HTMLDivElement>()
  private slatsRef = createRef<TimelineSlats>()
  private laneRootElRef = createRef<HTMLDivElement>()
  private laneFgElRef = createRef<HTMLDivElement>()
  private laneBgElRef = createRef<HTMLDivElement>()
  private lane: TimelineLane
  private tDateProfile: TimelineDateProfile
  private nowTimer: NowTimer
  private needsInitialScroll = false // bad to keep internal state here


  render(props: ViewProps, state: TimelineViewState, context: ComponentContext) {
    let { options, theme } = context
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
          forPrint={props.forPrint}
          vGrow={!props.isHeightAuto}
          colGroups={[
            { cols: slatCols }
          ]}
          sections={[
            {
              type: 'head',
              chunks: [{
                scrollerElRef: this.headerScrollerElRef,
                className: 'fc-time-area',
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
              vGrow: true,
              chunks: [{
                className: 'fc-time-area',
                content: (contentArg: ChunkContentCallbackArgs) => {
                  return (
                    <div class='fc-scroller-canvas' ref={this.laneRootElRef}>
                      <div class='fc-content' ref={this.laneFgElRef} />
                      <div class='fc-bg' ref={this.laneBgElRef}>
                        <div class='fc-slats'>
                          <table class={theme.getClass('table')} style={{ minWidth: contentArg.minWidth }}>
                            {contentArg.colGroupNode}
                            <tbody>
                              <TimelineSlats
                                ref={this.slatsRef}
                                dateProfile={dateProfile}
                                tDateProfile={tDateProfile}
                              />
                            </tbody>
                          </table>
                        </div>
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
    this.needsInitialScroll = true
    this.handleSizing(false)
    this.context.addResizeHandler(this.handleSizing)

    this.nowTimer = this.context.createNowIndicatorTimer(
      getTimelineNowIndicatorUnit(this.tDateProfile), // TODO: what if it changes!?
      (date: DateMarker) => {
        this.renderNowIndicator({
          headParentEl: this.headerScrollerElRef.current,
          bodyParentEl: this.laneRootElRef.current,
          tDateProfile: this.tDateProfile,
          slats: this.slatsRef.current,
          date
        })
      }
    )
  }


  componentDidUpdate(prevProps: ViewProps, prevState: TimelineViewState) {
    this.subrender()

    if (prevProps.dateProfile !== this.props.dateProfile) {
      this.needsInitialScroll = true
    }

    if (componentNeedsResize(prevProps, this.props, prevState, this.state, STATE_IS_SIZING)) {
      this.handleSizing(false)

    } else if (this.needsInitialScroll) {
      this.scrollToInitialTime()
      this.needsInitialScroll = false
    }
  }


  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
    this.subrenderDestroy()

    if (this.nowTimer) {
      this.nowTimer.destroy()
    }
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


  handleSizing = (forced: boolean) => {
    this.setState({
      slotMinWidth: this.computeSlotMinWidth()
    }, () => {
      let slats = this.slatsRef.current
      slats.buildPositionCaches()

      this.lane.computeSizes(forced, slats) // needs slat positions
      this.lane.assignSizes(forced, slats) // "
    })
  }


  computeSlotMinWidth() {
    let slotWidth = this.context.options.slotWidth || ''

    if (slotWidth === '') {
      slotWidth = computeDefaultSlotWidth(this.headerScrollerElRef.current, this.tDateProfile)
    }

    return slotWidth
  }


  // Scroll System
  // ------------------------------------------------------------------------------------------


  scrollToTime(duration: Duration) {
    let slats = this.slatsRef.current
    let scrollLeft = slats.computeDurationLeft(duration)
    let scrollGrid = this.scrollGridRef.current

    scrollGrid.forceScrollLeft(0, scrollLeft)
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
      minWidth: slotMinWidth || 1 // needs to be a non-zero number to trigger horizontal scrollbars!
    })
  }

  return cols
}
