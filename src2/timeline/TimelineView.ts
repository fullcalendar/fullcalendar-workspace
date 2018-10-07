import { View, DateComponentRenderState, RenderForceFlags, assignTo, wholeDivideDurations } from 'fullcalendar'
import { buildTimelineDateProfile, TimelineDateProfile } from './timeline-date-profile'
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

  tDateProfile: TimelineDateProfile

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
    this.hEventLane.setElement(this.bodyScroller.enhancedScroll.canvas.contentEl)
    this.bodyScroller.enhancedScroll.canvas.bgEl.appendChild(this.slats.el)
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

    this.tDateProfile = tDateProfile

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

    this.bodyScroller.setHeight(bodyHeight)

    let idealSlotWidth = this.opt('slotWidth') || ''
    if (idealSlotWidth === '' && this.renderedFlags.dates) {
      idealSlotWidth = this.computeDefaultSlotWidth()
    }

    this.applyWidths(idealSlotWidth)

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

  computeDefaultSlotWidth() {
    let { tDateProfile } = this
    let maxInnerWidth = 0 // TODO: harness core's `matchCellWidths` for this

    this.header.innerEls.forEach(function(innerEl, i) {
      maxInnerWidth = Math.max(maxInnerWidth, innerEl.offsetWidth)
    })

    let headerWidth = maxInnerWidth + 1 // assume no padding, and one pixel border

    // in TimelineView.defaults we ensured that labelInterval is an interval of slotDuration
    // TODO: rename labelDuration?
    let slotsPerLabel = wholeDivideDurations(tDateProfile.labelInterval, tDateProfile.slotDuration)

    let slotWidth = Math.ceil(headerWidth / slotsPerLabel)

    let minWidth: any = window.getComputedStyle(this.header.slatColEls[0]).minWidth
    if (minWidth) {
      minWidth = parseInt(minWidth, 10)
      if (minWidth) {
        slotWidth = Math.max(slotWidth, minWidth)
      }
    }

    return slotWidth
  }

  applyWidths(slotWidth: number | string) {
    let { tDateProfile } = this
    let containerWidth: number | string = ''
    let containerMinWidth: number | string = ''
    let nonLastSlotWidth: number | string = ''

    if (slotWidth !== '') {
      slotWidth = Math.round(slotWidth as number)

      containerWidth = slotWidth * tDateProfile.slotDates.length
      containerMinWidth = ''
      nonLastSlotWidth = slotWidth

      let availableWidth = this.bodyScroller.enhancedScroll.getClientWidth()

      if (availableWidth > containerWidth) {
        containerMinWidth = availableWidth
        containerWidth = ''
        nonLastSlotWidth = Math.floor(availableWidth / tDateProfile.slotDates.length)
      }
    }

    this.headScroller.enhancedScroll.canvas.setWidth(containerWidth)
    this.headScroller.enhancedScroll.canvas.setMinWidth(containerMinWidth)
    this.bodyScroller.enhancedScroll.canvas.setWidth(containerWidth)
    this.bodyScroller.enhancedScroll.canvas.setMinWidth(containerMinWidth)

    if (nonLastSlotWidth !== '') {
      this.header.slatColEls.slice(0, -1).concat(
        this.slats.slatColEls.slice(0, -1)
      ).forEach(function(el) {
        el.style.width = nonLastSlotWidth + 'px'
      })
    }
  }

}
