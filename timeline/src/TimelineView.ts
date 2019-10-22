import { Hit, View, ViewProps, ComponentContext, DateProfile, Duration, DateProfileGenerator, renderViewEl, renderer, memoize } from '@fullcalendar/core'
import TimeAxis from './TimeAxis'
import TimelineLane from './TimelineLane'
import { buildTimelineDateProfile } from './timeline-date-profile'

export default class TimelineView extends View {

  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private renderSkeleton = renderer(this._renderSkeleton)
  private startInteractive = renderer(this._startInteractive, this._stopInteractive)
  private renderTimeAxis = renderer(TimeAxis)
  private renderLane = renderer(TimelineLane)

  // child components
  timeAxis: TimeAxis
  lane: TimelineLane


  render(props: ViewProps, context: ComponentContext) {
    let tDateProfile = this.buildTimelineDateProfile(
      props.dateProfile,
      context.dateEnv,
      context.options,
      props.dateProfileGenerator
    )

    let {
      rootEl,
      headerContainerEl,
      bodyContainerEl
    } = this.renderSkeleton(true, { type: props.viewSpec.type })

    let timeAxis = this.renderTimeAxis(true, {
      tDateProfile,
      headerContainerEl,
      bodyContainerEl,
      dateProfile: props.dateProfile
    })

    let laneCanvas = timeAxis.layout.bodyScroller.enhancedScroller.canvas
    let lane = this.renderLane(true, {
      ...props,
      tDateProfile,
      nextDayThreshold: this.context.nextDayThreshold,
      fgContainerEl: laneCanvas.contentEl,
      bgContainerEl: laneCanvas.bgEl
    })

    this.startInteractive(true, { timeAxisEl: timeAxis.slats.rootEl })
    this.startNowIndicator(props.dateProfile, props.dateProfileGenerator)

    this.timeAxis = timeAxis
    this.lane = lane

    return rootEl
  }


  _renderSkeleton(props: { type: string }, context: ComponentContext) {
    let { options, theme } = context

    let rootEl = renderViewEl(props.type)
    rootEl.classList.add('fc-timeline')

    if (options.eventOverlap === false) {
      rootEl.classList.add('fc-no-overlap')
    }

    rootEl.innerHTML = `<table class="` + theme.getClass('tableGrid') + `"> \
<thead class="fc-head"> \
<tr> \
<td class="fc-time-area ` + theme.getClass('widgetHeader') + `"></td> \
</tr> \
</thead> \
<tbody class="fc-body"> \
<tr> \
<td class="fc-time-area ` + theme.getClass('widgetContent') + `"></td> \
</tr> \
</tbody> \
</table>`

    return {
      rootEl,
      headerContainerEl: rootEl.querySelector('thead .fc-time-area') as HTMLElement,
      bodyContainerEl: rootEl.querySelector('tbody .fc-time-area') as HTMLElement
    }
  }


  _startInteractive(props: { timeAxisEl: HTMLElement }, context: ComponentContext) {
    context.calendar.registerInteractiveComponent(this, {
      el: props.timeAxisEl
    })
  }


  _stopInteractive(funcState: void, context: ComponentContext) {
    context.calendar.unregisterInteractiveComponent(this)
  }


  updateSize(isResize, totalHeight, isAuto) {
    this.timeAxis.updateSize(isResize, totalHeight, isAuto)
    this.lane.updateSize(isResize, this.timeAxis)
  }


  // Now Indicator
  // ------------------------------------------------------------------------------------------


  getNowIndicatorUnit(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator) {
    return this.timeAxis.getNowIndicatorUnit(dateProfile, dateProfileGenerator)
  }


  renderNowIndicator(date) {
    this.timeAxis.renderNowIndicator(date)
  }


  unrenderNowIndicator() {
    this.timeAxis.unrenderNowIndicator()
  }


  // Scroll System
  // ------------------------------------------------------------------------------------------


  computeDateScroll(duration: Duration) {
    return this.timeAxis.computeDateScroll(duration)
  }


  applyScroll(scroll, isResize) {
    super.applyScroll(scroll, isResize) // will call applyDateScroll

    let { calendar } = this.context

    // avoid updating stickyscroll too often
    // TODO: repeat code as ResourceTimelineView::updateSize
    if (isResize || calendar.isViewUpdated || calendar.isDatesUpdated || calendar.isEventsUpdated) {

      this.timeAxis.updateStickyScrollers()
    }
  }


  applyDateScroll(scroll) {
    this.timeAxis.applyDateScroll(scroll)
  }


  queryScroll() {
    let { enhancedScroller } = this.timeAxis.layout.bodyScroller

    return {
      top: enhancedScroller.scroller.controller.getScrollTop(),
      left: enhancedScroller.getScrollLeft()
    }
  }


  // Hit System
  // ------------------------------------------------------------------------------------------


  buildPositionCaches() {
    this.timeAxis.slats.updateSize()
  }


  queryHit(positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit {
    let slatHit = this.timeAxis.slats.positionToHit(positionLeft)

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
