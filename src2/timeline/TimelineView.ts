import { View } from 'fullcalendar'
import HEventLane from './HEventLane'
import { buildTimelineDateProfile } from './timeline-date-profile'

export default class TimelineView extends View {

  hEventLane: HEventLane

  timeHeadEl: HTMLElement
  timeBodyEl: HTMLElement

  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)
    this.hEventLane = new HEventLane(this.view)
    this.addChild(this.hEventLane)
  }

  renderSkeleton() {
    this.el.classList.add('fc-timeline')

    if (this.opt('eventOverlap') === false) {
      this.el.classList.add('fc-no-overlap')
    }

    this.el.innerHTML = this.renderSkeletonHtml()

    this.timeHeadEl = this.el.querySelector('thead .fc-time-area')
    this.timeBodyEl = this.el.querySelector('tbody .fc-time-area')

    this.hEventLane.setElement(this.timeBodyEl)
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

  renderDates(dateProfile) {
    console.log(
      buildTimelineDateProfile(dateProfile, this.getDateEnv(), this)
    )
  }

}
