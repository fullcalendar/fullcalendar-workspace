import { View, DateComponentRenderState, RenderForceFlags } from 'fullcalendar'
import TimeAxis from './TimeAxis'
import TimelineLane from './TimelineLane'

export default class TimelineView extends View {

  // child components
  timeAxis: TimeAxis
  lane: TimelineLane

  renderSkeleton() {
    this.el.classList.add('fc-timeline')
    this.el.innerHTML = this.renderSkeletonHtml()

    this.timeAxis = new TimeAxis(
      this.view,
      this.el.querySelector('thead .fc-time-area'),
      this.el.querySelector('tbody .fc-time-area')
    )

    this.lane = new TimelineLane(this.view)
    this.lane.setParents(
      this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.contentEl,
      this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.bgEl,
      this.timeAxis
    )
  }

  renderSkeletonHtml() {
    let theme = this.getTheme()

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

  renderChildren(props: DateComponentRenderState, forceFlags: RenderForceFlags) {
    this.timeAxis.receiveProps({
      dateProfile: props.dateProfile
    })

    this.lane.render(props, forceFlags)
  }

  updateSize(totalHeight, isAuto, force) {
    this.timeAxis.updateHeight(totalHeight, isAuto)
    this.lane.updateSize(totalHeight, isAuto, force)
  }

  removeElement() {
    this.timeAxis.destroy()
    this.lane.removeElement() // TODO: doesn't work with two containers

    super.removeElement()
  }

}
