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
    let { cellRows } = tDateProfile
    let lastRow = cellRows[cellRows.length - 1]

    let html =
      '<table class="' + theme.getClass('tableGrid') + '">' +
      '<colgroup>'

    for (let _cell of lastRow) {
      html += '<col/>'
    }

    html += '</colgroup>'
    html += '<tbody><tr>'

    for (let cell of lastRow) {
      html += this.slatCellHtml(cell.date, cell.weekStart, tDateProfile)
    }

    html += '</tr></tbody></table>'

    this.el.innerHTML = html

    this.slatColEls = findElements(this.el, 'col')
    this.slatEls = findElements(this.el, 'td')

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
    this.buildPositionCaches()
  }

  buildPositionCaches() {
    this.innerCoordCache.build()
  }

  positionToHit(leftPosition) {
    let { innerCoordCache } = this
    let { tDateProfile } = this.props
    let index = innerCoordCache.leftToIndex(leftPosition)

    if (index != null) {
      let start = tDateProfile.slotDates[index]
      let end = this.dateEnv.add(start, tDateProfile.slotDuration)

      return {
        dateSpan: {
          range: { start, end },
          allDay: !this.props.tDateProfile.isTimeScale,
        },
        dayEl: this.slatColEls[index],
        left: innerCoordCache.lefts[index],
        right: innerCoordCache.rights[index]
      }
    }

    return null
  }

}
