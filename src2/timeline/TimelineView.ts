import { View, DateComponentRenderState, RenderForceFlags, assignTo } from 'fullcalendar'
import { buildTimelineDateProfile } from './timeline-date-profile'
import TimelineHeader from './TimelineHeader'
import TimelineSlats from './TimelineSlats'
import HEventLane from './HEventLane'
import ClippedScroller from '../util/ClippedScroller'
import ScrollerCanvas from '../util/ScrollerCanvas'
import ScrollJoiner from '../util/ScrollJoiner'

export default class TimelineView extends View {

  timeHeadEl: HTMLElement
  timeBodyEl: HTMLElement

  headScroller: ClippedScroller
  bodyScroller: ClippedScroller
  scrollJoiner: ScrollJoiner

  header: TimelineHeader
  slats: TimelineSlats
  hEventLane: HEventLane

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

    this.headScroller = new ClippedScroller('clipped-scroll', 'hidden')
    this.headScroller.enhancedScroll.canvas = new ScrollerCanvas()
    this.headScroller.render()

    this.bodyScroller = new ClippedScroller('auto', 'auto')
    this.bodyScroller.enhancedScroll.canvas = new ScrollerCanvas()
    this.bodyScroller.render()

    this.scrollJoiner = new ScrollJoiner('horizontal', [
      this.headScroller.enhancedScroll,
      this.bodyScroller.enhancedScroll
    ])

    this.timeHeadEl.appendChild(this.headScroller.el)
    this.timeBodyEl.appendChild(this.bodyScroller.el)

    this.header.setElement(this.headScroller.enhancedScroll.canvas.contentEl)
    this.slats.setElement(this.bodyScroller.enhancedScroll.canvas.bgEl)
    this.hEventLane.setElement(this.bodyScroller.enhancedScroll.canvas.contentEl)
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
    this.hEventLane.render()
  }

  updateSize(totalHeight, isAuto, force) {
    let bodyHeight

    if (isAuto) {
      bodyHeight = 'auto'
    } else {
      bodyHeight = totalHeight - this.queryHeadHeight() - this.queryMiscHeight()
    }

    // temp
    this.headScroller.enhancedScroll.canvas.setWidth(10000)
    this.bodyScroller.enhancedScroll.canvas.setWidth(10000)

    this.bodyScroller.setHeight(bodyHeight) // do first?
    this.headScroller.updateSize()
    this.bodyScroller.updateSize()
    this.scrollJoiner.update()
  }

  queryHeadHeight() {
    // TODO: cache <table>
    const table = this.headScroller.enhancedScroll.canvas.contentEl.querySelector('table')
    return table ? table.offsetHeight : 0 // why the check?
  }

  queryMiscHeight() {
    return this.el.offsetHeight -
      this.headScroller.el.offsetHeight -
      this.bodyScroller.el.offsetHeight
  }

}
