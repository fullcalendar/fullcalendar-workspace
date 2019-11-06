import { Hit, View, ViewProps, ComponentContext, Duration, renderViewEl, renderer, memoize } from '@fullcalendar/core'
import TimeAxis from './TimeAxis'
import TimelineLane from './TimelineLane'
import { buildTimelineDateProfile } from './timeline-date-profile'

export default class TimelineView extends View {

  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private renderSkeleton = renderer(this._renderSkeleton)
  private registerInteractive = renderer(this._registerInteractive, this._unregisterInteractive)
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
    } = this.renderSkeleton({ type: props.viewSpec.type })

    let timeAxis = this.renderTimeAxis({
      tDateProfile,
      headerContainerEl,
      bodyContainerEl,
      dateProfile: props.dateProfile
    })

    let laneCanvas = timeAxis.layout.bodyScroller.enhancedScroller.canvas
    let lane = this.renderLane({
      ...props,
      tDateProfile,
      nextDayThreshold: this.context.nextDayThreshold,
      fgContainerEl: laneCanvas.contentEl,
      bgContainerEl: laneCanvas.bgEl
    })

    this.registerInteractive({ timeAxisEl: timeAxis.slats.rootEl })
    this.startNowIndicator()

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


  _registerInteractive(props: { timeAxisEl: HTMLElement }, context: ComponentContext) {
    context.calendar.registerInteractiveComponent(this, {
      el: props.timeAxisEl
    })
  }


  _unregisterInteractive(funcState: void, context: ComponentContext) {
    context.calendar.unregisterInteractiveComponent(this)
  }


  updateSize(isResize, totalHeight, isAuto) {
    this.timeAxis.updateSize(isResize, totalHeight, isAuto)
    this.lane.updateSize(isResize, this.timeAxis)
  }


  // Now Indicator
  // ------------------------------------------------------------------------------------------


  getNowIndicatorUnit() {
    return this.timeAxis.getNowIndicatorUnit()
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

    // avoid updating stickyscroll too often
    if (isResize || this.isLayoutSizeDirty()) {
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
