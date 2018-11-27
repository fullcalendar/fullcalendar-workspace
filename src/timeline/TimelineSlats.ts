import { isInt, findElements, createElement, findChildren, PositionCache, removeElement, getDayClasses, Component, ComponentContext, DateProfile } from 'fullcalendar'
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

  constructor(context: ComponentContext, parentEl: HTMLElement) {
    super(context)

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
    let { theme } = this
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
    let { theme, dateEnv } = this
    let classes

    if (tDateProfile.isTimeScale) {
      classes = []
      classes.push(
        isInt(dateEnv.countDurationsBetween(
          tDateProfile.normalizedStart,
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

  updateSize() {
    this.outerCoordCache.build()
    this.innerCoordCache.build()
  }

  positionToHit(leftPosition) {
    let { outerCoordCache } = this
    let { tDateProfile } = this.props
    let index = outerCoordCache.leftToIndex(leftPosition)

    if (index != null) {
      let start = tDateProfile.slotDates[index]
      let end = this.dateEnv.add(start, tDateProfile.slotDuration)

      return {
        dateSpan: {
          range: { start, end },
          allDay: !this.props.tDateProfile.isTimeScale,
        },
        dayEl: this.slatColEls[index],
        left: outerCoordCache.lefts[index],
        right: outerCoordCache.rights[index]
      }
    }

    return null
  }

}
