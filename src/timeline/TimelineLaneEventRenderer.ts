import { EventDef, Calendar, FgEventRenderer, htmlEscape, cssToStr, Seg, removeElement, applyStyle, computeHeightAndMargins, applyStyleProp, createElement, ComponentContext } from '@fullcalendar/core'
import TimeAxis from './TimeAxis'
// import { computeResourceEditable } from '@fullcalendar/resource-common' ... CAN'T HAVE THIS DEP! COPIED AND PASTED BELOW!

export default class TimelineLaneEventRenderer extends FgEventRenderer {

  timeAxis: TimeAxis
  masterContainerEl: HTMLElement
  el: HTMLElement

  constructor(context: ComponentContext, masterContainerEl: HTMLElement, timeAxis: TimeAxis) {
    super(context)

    this.masterContainerEl = masterContainerEl
    this.timeAxis = timeAxis
  }

  renderSegHtml(seg, mirrorInfo) {
    let eventRange = seg.eventRange
    let eventDef = eventRange.def
    let eventUi = eventRange.ui
    let isDraggable = eventUi.startEditable || computeResourceEditable(eventDef, this.timeAxis.calendar)
    let isResizableFromStart = seg.isStart && eventUi.durationEditable && this.context.options.eventResizableFromStart
    let isResizableFromEnd = seg.isEnd && eventUi.durationEditable

    let classes = this.getSegClasses(seg, isDraggable, isResizableFromStart || isResizableFromEnd, mirrorInfo)
    classes.unshift('fc-timeline-event', 'fc-h-event')

    let timeText = this.getTimeText(eventRange)

    return '<a class="' + classes.join(' ') + '" style="' + cssToStr(this.getSkinCss(eventUi)) + '"' +
      (eventDef.url ?
        ' href="' + htmlEscape(eventDef.url) + '"' :
        '') +
      '>' +
      '<div class="fc-content">' +
        (timeText ?
          '<span class="fc-time">' +
            htmlEscape(timeText) +
          '</span>'
        :
          '') +
        '<span class="fc-title fc-sticky">' +
          (eventDef.title ? htmlEscape(eventDef.title) : '&nbsp;') +
        '</span>' +
      '</div>' +
      (isResizableFromStart ?
        '<div class="fc-resizer fc-start-resizer"></div>' :
        '') +
      (isResizableFromEnd ?
        '<div class="fc-resizer fc-end-resizer"></div>' :
        '') +
    '</a>'
  }

  computeDisplayEventTime() {
    return !this.timeAxis.tDateProfile.isTimeScale // because times should be obvious via axis
  }

  computeDisplayEventEnd() {
    return false
  }

  // Computes a default event time formatting string if `timeFormat` is not explicitly defined
  computeEventTimeFormat() {
    return {
      hour: 'numeric',
      minute: '2-digit',
      omitZeroMinute: true,
      meridiem: 'narrow'
    }
  }

  attachSegs(segs: Seg[], mirrorInfo) {

    if (!this.el && this.masterContainerEl) {
      this.el = createElement('div', { className: 'fc-event-container' })

      if (mirrorInfo) {
        this.el.classList.add('fc-mirror-container')
      }

      this.masterContainerEl.appendChild(this.el)
    }

    if (this.el) {
      for (let seg of segs) {
        this.el.appendChild(seg.el)
      }
    }
  }

  detachSegs(segs: Seg[]) {
    for (let seg of segs) {
      removeElement(seg.el)
    }
  }

  // computes AND assigns (assigns the left/right at least). bad
  computeSegSizes(segs: Seg[]) {
    let { timeAxis } = this

    for (let seg of segs) {
      let coords = timeAxis.rangeToCoords(seg) // works because Seg has start/end

      applyStyle(seg.el, {
        left: (seg.left = coords.left),
        right: -(seg.right = coords.right)
      })
    }
  }

  assignSegSizes(segs: Seg[]) {
    if (!this.el) {
      return
    }

    // compute seg verticals
    for (let seg of segs) {
      seg.height = computeHeightAndMargins(seg.el)
    }

    this.buildSegLevels(segs) // populates above/below props for computeOffsetForSegs
    let totalHeight = computeOffsetForSegs(segs) // also assigns seg.top
    applyStyleProp(this.el, 'height', totalHeight)

    // assign seg verticals
    for (let seg of segs) {
      applyStyleProp(seg.el, 'top', seg.top)
    }
  }

  buildSegLevels(segs) {
    let segLevels = []

    segs = this.sortEventSegs(segs)

    for (let unplacedSeg of segs) {
      unplacedSeg.above = []

      // determine the first level with no collisions
      let level = 0 // level index
      while (level < segLevels.length) {
        let isLevelCollision = false

        // determine collisions
        for (let placedSeg of segLevels[level]) {
          if (timeRowSegsCollide(unplacedSeg, placedSeg)) {
            unplacedSeg.above.push(placedSeg)
            isLevelCollision = true
          }
        }

        if (isLevelCollision) {
          level += 1
        } else {
          break
        }
      }

      // insert into the first non-colliding level. create if necessary
      (segLevels[level] || (segLevels[level] = []))
        .push(unplacedSeg)

      // record possible colliding segments below (TODO: automated test for this)
      level += 1
      while (level < segLevels.length) {
        for (let belowSeg of segLevels[level]) {
          if (timeRowSegsCollide(unplacedSeg, belowSeg)) {
            belowSeg.above.push(unplacedSeg)
          }
        }
        level += 1
      }
    }

    return segLevels
  }

}

function computeOffsetForSegs(segs) {
  let max = 0

  for (let seg of segs) {
    max = Math.max(max, computeOffsetForSeg(seg))
  }

  return max
}


function computeOffsetForSeg(seg) {
  if ((seg.top == null)) {
    seg.top = computeOffsetForSegs(seg.above)
  }

  return seg.top + seg.height
}


function timeRowSegsCollide(seg0, seg1) {
  return (seg0.left < seg1.right) && (seg0.right > seg1.left)
}

// HACK
function computeResourceEditable(eventDef: EventDef, calendar: Calendar): boolean {
  let { resourceEditable } = eventDef

  if (resourceEditable == null) {
    let source = eventDef.sourceId && calendar.state.eventSources[eventDef.sourceId]

    if (source) {
      resourceEditable = source.extendedProps.resourceEditable // used the Source::extendedProps hack
    }

    if (resourceEditable == null) {
      resourceEditable = calendar.opt('eventResourceEditable')

      if (resourceEditable == null) {
        resourceEditable = true // TODO: use defaults system instead
      }
    }
  }

  return resourceEditable
}
