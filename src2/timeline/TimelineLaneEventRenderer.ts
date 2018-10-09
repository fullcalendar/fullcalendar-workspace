import { EventRenderer, htmlEscape, cssToStr, Seg, removeElement, applyStyle, computeHeightAndMargins, applyStyleProp } from 'fullcalendar'
import TimelineView from './TimelineView'

export default class TimelineLaneEventRenderer extends EventRenderer {

  fgSegHtml(seg) {
    let eventRange = seg.eventRange
    let eventDef = eventRange.def
    let eventUi = eventRange.ui
    let isDraggable = eventUi.startEditable
    let isResizableFromStart = seg.isStart && eventUi.durationEditable && this.opt('eventResizableFromStart')
    let isResizableFromEnd = seg.isEnd && eventUi.durationEditable

    let classes = this.getSegClasses(seg, isDraggable, isResizableFromStart || isResizableFromEnd)
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
        '<span class="fc-title">' +
          (eventDef.title ? htmlEscape(eventDef.title) : '&nbsp;') +
        '</span>' +
      '</div>' +
      '<div class="fc-bg"></div>' +
      (isResizableFromStart ?
        '<div class="fc-resizer fc-start-resizer"></div>' :
        '') +
      (isResizableFromEnd ?
        '<div class="fc-resizer fc-end-resizer"></div>' :
        '') +
    '</a>'
  }

  renderFgSegs(segs: Seg[]) {
    for (let seg of segs) {
      this.component.el.appendChild(seg.el)
    }
  }

  unrenderFgSegs(segs: Seg[]) {
    for (let seg of segs) {
      removeElement(seg.el)
    }
  }

  // computes AND assigns (assigns the left/right at least). bad
  computeFgSize() {
    let view = this.view as TimelineView // BAD!
    let segs = this.fgSegs

    for (let seg of segs) {
      let coords = view.rangeToCoords(seg) // works because Seg has start/end

      applyStyle(seg.el, {
        left: (seg.left = coords.left),
        right: -(seg.right = coords.right)
      })
    }
  }

  assignFgSize() {
    let segs = this.fgSegs

    // compute seg verticals
    for (let seg of segs) {
      seg.height = computeHeightAndMargins(seg.el)
    }

    this.buildSegLevels(segs) // populates above/below props for computeOffsetForSegs
    computeOffsetForSegs(segs) // TODO: do something with the returned height!

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
