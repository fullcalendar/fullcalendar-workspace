import { View, StandardDateComponentProps } from 'fullcalendar'
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
      this.context,
      this.el.querySelector('thead .fc-time-area'),
      this.el.querySelector('tbody .fc-time-area')
    )

    this.lane = new TimelineLane(
      this.context,
      this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.contentEl,
      this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.bgEl,
      this.timeAxis
    )
  }

  renderSkeletonHtml() {
    let { theme } = this

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

  render(props: StandardDateComponentProps) {
    super.render(props)

    this.timeAxis.receiveProps({
      dateProfile: props.dateProfile
    })

    this.lane.receiveProps(props)
  }

  updateSize(totalHeight, isAuto, isResize) {
    this.timeAxis.updateSize(totalHeight, isAuto, isResize)
    this.lane.updateSize(totalHeight, isAuto, isResize)
  }

  destroy() {
    this.timeAxis.destroy()
    this.lane.destroy() // TODO: doesn't work with two containers

    super.destroy()
  }

}
