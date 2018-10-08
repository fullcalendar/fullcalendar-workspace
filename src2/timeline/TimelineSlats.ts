import { DateComponent, DateComponentRenderState, RenderForceFlags, isInt, findElements, createElement, findChildren, DateProfile, PositionCache } from 'fullcalendar'
import { TimelineDateProfile } from './timeline-date-profile'

export default class TimelineSlats extends DateComponent {

  tDateProfile: TimelineDateProfile

  el: HTMLElement = createElement('div', { className: 'fc-slats' })
  slatColEls: HTMLElement[]
  slatEls: HTMLElement[]

  innerCoordCache: PositionCache

  render(renderState: DateComponentRenderState, forceFlags: RenderForceFlags) {
    this.tDateProfile = (renderState as any).tDateProfile
    super.render(renderState, forceFlags)
  }

  renderDates(dateProfile: DateProfile) {
    let theme = this.getTheme()
    let { tDateProfile } = this
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
    let dateEnv = this.getDateEnv()
    let theme = this.getTheme()
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
      classes = this.getDayClasses(date)
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

  buildPositionCaches() {
    this.innerCoordCache.build()
  }

}
