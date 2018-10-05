import { View, DateComponentRenderState, RenderForceFlags, assignTo } from 'fullcalendar'
import { buildTimelineDateProfile } from './timeline-date-profile'
import TimelineHeader from './TimelineHeader'
import TimelineSlats from './TimelineSlats'
import HEventLane from './HEventLane'

export default class TimelineView extends View {

  header: TimelineHeader
  slats: TimelineSlats
  hEventLane: HEventLane

  timeHeadEl: HTMLElement
  timeBodyEl: HTMLElement

  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)

    this.addChild(
      this.header = new TimelineHeader(this.view)
    )
    this.addChild(
      this.slats = new TimelineSlats(this.view)
    )
    this.addChild(
      this.hEventLane = new HEventLane(this.view)
    )
  }

  renderSkeleton() {
    this.el.classList.add('fc-timeline')

    if (this.opt('eventOverlap') === false) {
      this.el.classList.add('fc-no-overlap')
    }

    this.el.innerHTML = this.renderSkeletonHtml()

    this.timeHeadEl = this.el.querySelector('thead .fc-time-area')
    this.timeBodyEl = this.el.querySelector('tbody .fc-time-area')

    this.header.setElement(this.timeHeadEl)
    this.slats.setElement(this.timeBodyEl)
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

  renderChildren(renderState: DateComponentRenderState, forceFlags: RenderForceFlags) {
    let dateEnv = this.getDateEnv()
    let tDateProfile = buildTimelineDateProfile(renderState.dateProfile, dateEnv, this) // TODO: cache
    let betterState = assignTo({}, renderState, {
      tDateProfile
    })

    this.header.render(betterState, forceFlags)
    this.slats.render(betterState, forceFlags)
  }

}
