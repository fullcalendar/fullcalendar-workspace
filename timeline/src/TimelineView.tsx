import { Hit, View, ViewProps, ComponentContext, Duration, memoize, subrenderer, ViewSpec, getViewClassNames } from '@fullcalendar/core'
import TimeColsWidthSyncer from './TimeColsWidthSyncer'
import TimelineLane from './TimelineLane'
import { buildTimelineDateProfile, TimelineDateProfile } from './timeline-date-profile'
import TimelineViewLayout from './TimelineViewLayout'
import { h, createRef } from 'preact'
import TimelineHeader from './TimelineHeader'
import TimelineSlats from './TimelineSlats'
import TimelineNowIndicator, { getTimelineNowIndicatorUnit } from './TimelineNowIndicator'


export default class TimelineView extends View {

  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private registerInteractive = subrenderer(this._registerInteractive, this._unregisterInteractive)
  private renderLane = subrenderer(TimelineLane)
  private timeColsWidthSyncer = new TimeColsWidthSyncer()
  private renderNowIndicatorMarkers = subrenderer(TimelineNowIndicator)
  private rootElRef = createRef<HTMLDivElement>()
  private layoutRef = createRef<TimelineViewLayout>()
  private headerRef = createRef<TimelineHeader>()
  private slatsRef = createRef<TimelineSlats>()
  private lane: TimelineLane
  private tDateProfile: TimelineDateProfile

  getRootEl() { return this.rootElRef.current }


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

    return (
      <div class={classNames.join(' ')} ref={this.rootElRef}>
        <TimelineViewLayout ref={this.layoutRef}
          headContent={
            <TimelineHeader
              ref={this.headerRef}
              dateProfile={dateProfile}
              tDateProfile={tDateProfile}
            />
          }
          bodyBgContent={
            <TimelineSlats
              ref={this.slatsRef}
              dateProfile={dateProfile}
              tDateProfile={tDateProfile}
            />
          }
        />
      </div>
    )
  }


  componentDidMount() {
    this.subrender()
    this.startNowIndicator()
  }


  componentDidUpdate() {
    this.subrender()
  }


  componentWillUnmount() {
    this.stopNowIndicator()
    this.subrenderDestroy()
  }


  subrender() {
    let layout = this.layoutRef.current
    let laneCanvas = layout.bodyClippedScroller.canvas

    this.lane = this.renderLane({
      ...this.props,
      tDateProfile: this.tDateProfile,
      nextDayThreshold: this.context.nextDayThreshold,
      fgContainerEl: laneCanvas.fgEl,
      bgContainerEl: laneCanvas.bgEl
    })

    this.registerInteractive({
      canvasRoot: laneCanvas.rootEl
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


  updateSize(isResize, viewHeight, isAuto) {
    let layout = this.layoutRef.current
    let slats = this.slatsRef.current
    let header = this.headerRef.current
    let { lane } = this

    let availableWidth = layout.getAvailableWidth()
    let { containerWidth, containerMinWidth } = this.timeColsWidthSyncer.updateSize({
      availableWidth,
      dateProfile: this.props.dateProfile,
      tDateProfile: this.tDateProfile,
      header,
      slats
    }, this.context)

    layout.setWidths(containerWidth, containerMinWidth)
    layout.setHeight(viewHeight, isAuto)
    slats.buildPositionCaches()
    lane.computeSizes(isResize, slats)
    lane.assignSizes(isResize, slats)
    layout.updateStickyScrolling()
  }


  // Now Indicator
  // ------------------------------------------------------------------------------------------


  getNowIndicatorUnit() {
    return getTimelineNowIndicatorUnit(this.tDateProfile)
  }


  renderNowIndicator(date) {
    let layout = this.layoutRef.current

    this.renderNowIndicatorMarkers({
      headParentEl: layout.headClippedScroller.canvas.rootEl,
      bodyParentEl: layout.bodyClippedScroller.canvas.rootEl,
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


  computeDateScroll(duration: Duration) {
    let slats = this.slatsRef.current

    return {
      left: slats.computeDurationLeft(duration)
    }
  }


  applyScroll(scroll, isResize) {
    let layout = this.layoutRef.current

    super.applyScroll(scroll, isResize) // will call applyDateScroll

    // avoid updating stickyscroll too often
    if (isResize || this.isLayoutSizeDirty()) {
      layout.updateStickyScrolling()
    }
  }


  applyDateScroll(scroll) {
    let layout = this.layoutRef.current

    // TODO: lame we have to update both. use the scrolljoiner instead maybe
    layout.bodyClippedScroller.enhancedScroller.setScrollLeft(scroll.left || 0)
    layout.headClippedScroller.enhancedScroller.setScrollLeft(scroll.left || 0)
  }


  queryScroll() {
    let layout = this.layoutRef.current
    let { enhancedScroller } = layout.bodyClippedScroller

    return {
      top: enhancedScroller.scroller.controller.getScrollTop(),
      left: enhancedScroller.getScrollLeft()
    }
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
