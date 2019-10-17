import { isInt, findElements, createElement, findChildren, PositionCache, removeElement, getDayClasses, Component, DateProfile, multiplyDuration } from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'

export interface TimelineSlatsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
}

export default class TimelineSlats extends Component<TimelineSlatsProps> {

  el: HTMLElement
  slatColEls: HTMLElement[]
  slatEls: HTMLElement[]

  outerCoordCache: PositionCache
  innerCoordCache: PositionCache

  constructor(parentEl: HTMLElement) {
    super()

    parentEl.appendChild(
      this.el = createElement('div', { className: 'fc-slats' })
    )
  }

  destroy() {
    removeElement(this.el)

    super.destroy()
  }

  render(props: TimelineSlatsProps) {
    this.renderDates(props.tDateProfile)
  }

  renderDates(tDateProfile: TimelineDateProfile) {
    let { calendar, view, theme, dateEnv } = this.context
    let { slotDates, isWeekStarts } = tDateProfile

    let html =
      '<table class="' + theme.getClass('tableGrid') + '">' +
      '<colgroup>'

    for (let i = 0; i < slotDates.length; i++) {
      html += '<col/>'
    }

    html += '</colgroup>'
    html += '<tbody><tr>'

    for (let i = 0; i < slotDates.length; i++) {
      html += this.slatCellHtml(slotDates[i], isWeekStarts[i], tDateProfile)
    }

    html += '</tr></tbody></table>'

    this.el.innerHTML = html

    this.slatColEls = findElements(this.el, 'col')
    this.slatEls = findElements(this.el, 'td')

    for (let i = 0; i < slotDates.length; i++) {
      calendar.publiclyTrigger('dayRender', [
        {
          date: dateEnv.toDate(slotDates[i]),
          el: this.slatEls[i],
          view
        }
      ])
    }

    this.outerCoordCache = new PositionCache(
      this.el,
      this.slatEls,
      true, // isHorizontal
      false // isVertical
    )

    // for the inner divs within the slats
    // used for event rendering and scrollTime, to disregard slat border
    this.innerCoordCache = new PositionCache(
      this.el,
      findChildren(this.slatEls, 'div'),
      true, // isHorizontal
      false // isVertical
    )
  }

  slatCellHtml(date, isEm, tDateProfile: TimelineDateProfile) {
    let { theme, dateEnv } = this.context
    let classes

    if (tDateProfile.isTimeScale) {
      classes = []
      classes.push(
        isInt(dateEnv.countDurationsBetween(
          tDateProfile.normalizedRange.start,
          date,
          tDateProfile.labelInterval
        )) ?
          'fc-major' :
          'fc-minor'
      )
    } else {
      classes = getDayClasses(date, this.props.dateProfile, this.context)
      classes.push('fc-day')
    }

    classes.unshift(theme.getClass('widgetContent'))

    if (isEm) {
      classes.push('fc-em-cell')
    }

    return '<td class="' + classes.join(' ') + '"' +
      ' data-date="' + dateEnv.formatIso(date, { omitTime: !tDateProfile.isTimeScale, omitTimeZoneOffset: true }) + '"' +
      '><div></div></td>'
  }

  updateSize() { // just updates position caches
    this.outerCoordCache.build()
    this.innerCoordCache.build()
  }

  positionToHit(leftPosition) {
    let { outerCoordCache } = this
    let { dateEnv, isRtl } = this.context
    let { tDateProfile } = this.props
    let slatIndex = outerCoordCache.leftToIndex(leftPosition)

    if (slatIndex != null) {
      // somewhat similar to what TimeGrid does. consolidate?
      let slatWidth = outerCoordCache.getWidth(slatIndex)
      let partial = isRtl ?
        (outerCoordCache.rights[slatIndex] - leftPosition) / slatWidth :
        (leftPosition - outerCoordCache.lefts[slatIndex]) / slatWidth
      let localSnapIndex = Math.floor(partial * tDateProfile.snapsPerSlot)
      let start = dateEnv.add(
        tDateProfile.slotDates[slatIndex],
        multiplyDuration(tDateProfile.snapDuration, localSnapIndex)
      )
      let end = dateEnv.add(start, tDateProfile.snapDuration)

      return {
        dateSpan: {
          range: { start, end },
          allDay: !this.props.tDateProfile.isTimeScale
        },
        dayEl: this.slatColEls[slatIndex],
        left: outerCoordCache.lefts[slatIndex], // TODO: make aware of snaps?
        right: outerCoordCache.rights[slatIndex]
      }
    }

    return null
  }

}
