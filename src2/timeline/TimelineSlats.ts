import { DateComponent, DateComponentRenderState, RenderForceFlags, isInt } from 'fullcalendar'
import { TimelineDateProfile } from './timeline-date-profile'

export default class TimelineSlats extends DateComponent {

  // TODO: only when tDateProfile change
  render(renderState: DateComponentRenderState, forceFlags: RenderForceFlags) {
    super.render(renderState, forceFlags)

    let theme = this.getTheme()
    let tDateProfile = (renderState as any).tDateProfile as TimelineDateProfile
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

}
