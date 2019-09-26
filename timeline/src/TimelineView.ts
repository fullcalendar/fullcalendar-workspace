import { Hit, View, ViewProps, ComponentContext, DateProfile, Duration } from '@fullcalendar/core'
import TimeAxis from './TimeAxis'
import TimelineLane from './TimelineLane'

export default class TimelineView extends View {

  // child components
  timeAxis: TimeAxis
  lane: TimelineLane

  setContext(context: ComponentContext) {
    super.setContext(context)

    this.el.classList.add('fc-timeline')

    if (context.options.eventOverlap === false) {
      this.el.classList.add('fc-no-overlap')
    }

    this.el.innerHTML = this.renderSkeletonHtml()

    this.timeAxis = new TimeAxis(
      this.el.querySelector('thead .fc-time-area'),
      this.el.querySelector('tbody .fc-time-area')
    )
    this.timeAxis.setContext(context)

    this.lane = new TimelineLane(
      this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.contentEl,
      this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.bgEl,
      this.timeAxis
    )
    this.lane.setContext(context)

    context.calendar.registerInteractiveComponent(this, {
      el: this.timeAxis.slats.el
    })
  }

  destroy() {
    this.timeAxis.destroy()
    this.lane.destroy()

    super.destroy()

    this.context.calendar.unregisterInteractiveComponent(this)
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

  render(props: ViewProps) {
    super.render(props) // flags for updateSize, addScroll

    this.timeAxis.receiveProps({
      dateProfileGenerator: props.dateProfileGenerator,
      dateProfile: props.dateProfile
    })

    this.lane.receiveProps({
      ...props,
      nextDayThreshold: this.context.nextDayThreshold
    })
  }

  updateSize(isResize, totalHeight, isAuto) {
    this.timeAxis.updateSize(isResize, totalHeight, isAuto)
    this.lane.updateSize(isResize)
  }


  // Now Indicator
  // ------------------------------------------------------------------------------------------

  getNowIndicatorUnit(dateProfile: DateProfile) {
    return this.timeAxis.getNowIndicatorUnit(dateProfile)
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
