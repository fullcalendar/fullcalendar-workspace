import { memoizeRendering, Hit, View, ViewProps, ComponentContext, DateProfile, Duration, DateProfileGenerator } from '@fullcalendar/core'
import TimeAxis from './TimeAxis'
import TimelineLane from './TimelineLane'

export default class TimelineView extends View {

  // child components
  timeAxis: TimeAxis
  lane: TimelineLane

  private renderSkeleton = memoizeRendering(this._renderSkeleton, this._unrenderSkeleton)
  private startInteractive = memoizeRendering(this._startInteractive, this._stopInteractive)


  _startInteractive(timeAxisEl: HTMLElement) {
    this.context.calendar.registerInteractiveComponent(this, {
      el: timeAxisEl
    })
  }


  _stopInteractive() {
    this.context.calendar.unregisterInteractiveComponent(this)
  }


  render(props: ViewProps, context: ComponentContext) {
    super.render(props, context) // flags for updateSize, addScroll. and _renderSkeleton/_unrenderSkeleton

    this.renderSkeleton(this.context)

    this.timeAxis.receiveProps({
      dateProfileGenerator: props.dateProfileGenerator,
      dateProfile: props.dateProfile
    }, context)

    this.startInteractive(this.timeAxis.slats.el)

    this.lane.receiveProps({
      ...props,
      nextDayThreshold: this.context.nextDayThreshold
    }, context)

    this.startNowIndicator(props.dateProfile, props.dateProfileGenerator)
  }


  destroy() {
    this.startInteractive.unrender() // "unrender" a weird name
    this.renderSkeleton.unrender()

    super.destroy()
  }


  _renderSkeleton(context: ComponentContext) {

    this.el.classList.add('fc-timeline')
    if (context.options.eventOverlap === false) {
      this.el.classList.add('fc-no-overlap')
    }

    this.el.innerHTML = this.renderSkeletonHtml()

    this.timeAxis = new TimeAxis(
      this.el.querySelector('thead .fc-time-area'),
      this.el.querySelector('tbody .fc-time-area')
    )

    this.lane = new TimelineLane(
      this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.contentEl,
      this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.bgEl,
      this.timeAxis
    )
  }


  _unrenderSkeleton() {
    this.el.classList.remove('fc-timeline')
    this.el.classList.remove('fc-no-overlap')

    this.timeAxis.destroy()
    this.lane.destroy()
  }


  renderSkeletonHtml() {
    let { theme } = this.context

    return `<table class="` + theme.getClass('tableGrid') + `"> \
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
  }


  updateSize(isResize, totalHeight, isAuto) {
    this.timeAxis.updateSize(isResize, totalHeight, isAuto)
    this.lane.updateSize(isResize)
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
    let { enhancedScroll } = this.timeAxis.layout.bodyScroller

    return {
      top: enhancedScroll.getScrollTop(),
      left: enhancedScroll.getScrollLeft()
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
