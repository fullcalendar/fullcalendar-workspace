import { DateComponentRenderState, RenderForceFlags, assignTo } from 'fullcalendar'
import { buildTimelineDateProfile, TimelineDateProfile } from './timeline-date-profile'
import TimelineHeader from './TimelineHeader'
import TimelineSlats from './TimelineSlats'
import TimelineLane from './TimelineLane'
import ClippedScroller from '../util/ClippedScroller'
import ScrollerCanvas from '../util/ScrollerCanvas'
import ScrollJoiner from '../util/ScrollJoiner'
import AbstractTimelineView from './AbstractTimelineView'

export default class TimelineView extends AbstractTimelineView {

  tDateProfile: TimelineDateProfile

  timeHeadEl: HTMLElement
  timeBodyEl: HTMLElement

  headScroller: ClippedScroller
  bodyScroller: ClippedScroller
  scrollJoiner: ScrollJoiner

  header: TimelineHeader
  slats: TimelineSlats
  lane: TimelineLane

  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)

    this.addChild(
      this.header = new TimelineHeader(this.view)
    )
    this.addChild(
      this.slats = new TimelineSlats(this.view)
    )
    this.addChild(
      this.lane = new TimelineLane(this.view)
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

    this.header.setElement(this.headScroller.enhancedScroll.canvas.contentEl) // TODO: give own root el
    this.bodyScroller.enhancedScroll.canvas.contentEl.appendChild(this.lane.el)
    this.bodyScroller.enhancedScroll.canvas.bgEl.appendChild(this.slats.el)

    // hack. puts the lane's fills within the fc-bg of the view
    this.lane.fillRenderer.masterContainerEl = this.bodyScroller.enhancedScroll.canvas.bgEl
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

    let tDateProfile = this.tDateProfile =
      buildTimelineDateProfile(renderState.dateProfile, dateEnv, this) // TODO: cache

    let timelineRenderState = assignTo({}, renderState, {
      tDateProfile
    })

    this.header.render(timelineRenderState, forceFlags)
    this.slats.render(timelineRenderState, forceFlags)
    this.lane.render(timelineRenderState, forceFlags)
  }

  updateSize(totalHeight, isAuto, force) {
    let bodyHeight

    if (isAuto) {
      bodyHeight = 'auto'
    } else {
      bodyHeight = totalHeight - this.queryHeadHeight() - this.queryMiscHeight()
    }

    this.bodyScroller.setHeight(bodyHeight)

    this.updateWidths()

    this.header.updateSize(totalHeight, isAuto, force)
    this.slats.updateSize(totalHeight, isAuto, force)
    this.lane.updateSize(totalHeight, isAuto, force)

    this.headScroller.updateSize()
    this.bodyScroller.updateSize()
    this.scrollJoiner.update()
  }

  queryHeadHeight() {
    // TODO: cache <table>
    let table = this.headScroller.enhancedScroll.canvas.contentEl.querySelector('table')
    return table ? table.offsetHeight : 0 // why the check?
  }

  queryMiscHeight() {
    return this.el.offsetHeight -
      this.headScroller.el.offsetHeight -
      this.bodyScroller.el.offsetHeight
  }

}
