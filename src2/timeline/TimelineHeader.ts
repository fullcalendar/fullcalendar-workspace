import { DateComponent, DateComponentRenderState, RenderForceFlags, asRoughMs, isSingleDay, findElements, DateProfile } from 'fullcalendar'
import { TimelineDateProfile } from './timeline-date-profile'

export default class TimelineHeader extends DateComponent {

  tDateProfile: TimelineDateProfile

  slatColEls: HTMLElement[]
  innerEls: HTMLElement[]

  render(renderState: DateComponentRenderState, forceFlags: RenderForceFlags) {
    this.tDateProfile = (renderState as any).tDateProfile
    super.render(renderState, forceFlags)
  }

  renderDates(dateProfile: DateProfile) {
    let dateEnv = this.getDateEnv()
    let theme = this.getTheme()
    let { tDateProfile } = this
    let { cellRows } = tDateProfile
    let lastRow = cellRows[cellRows.length - 1]
    let isChrono = asRoughMs(tDateProfile.labelInterval) > asRoughMs(tDateProfile.slotDuration)
    let oneDay = isSingleDay(tDateProfile.slotDuration)

    let html =
      '<table class="' + theme.getClass('tableGrid') + '">' +
      '<colgroup>'

    for (let _cell of lastRow) {
      html += '<col/>'
    }

    html += '</colgroup>'
    html += '<tbody>'

    for (let rowCells of cellRows) {
      let isLast = rowCells === lastRow

      html += '<tr' + (isChrono && isLast ? ' class="fc-chrono"' : '') + '>'

      for (let cell of rowCells) {
        let headerCellClassNames = [ theme.getClass('widgetHeader') ]

        if (cell.weekStart) {
          headerCellClassNames.push('fc-em-cell')
        }
        if (oneDay) {
          headerCellClassNames = headerCellClassNames.concat(
            this.getDayClasses(cell.date, true) // adds "today" class and other day-based classes
          )
        }

        html +=
          '<th class="' + headerCellClassNames.join(' ') + '"' +
            ' data-date="' + dateEnv.formatIso(cell.date, { omitTime: !tDateProfile.isTimeScale, omitTimeZoneOffset: true }) + '"' +
            (cell.colspan > 1 ? ' colspan="' + cell.colspan + '"' : '') +
          '>' +
            '<div class="fc-cell-content">' +
              cell.spanHtml +
            '</div>' +
          '</th>'
      }

      html += '</tr>'
    }

    html += '</tbody></table>'

    this.el.innerHTML = html

    this.slatColEls = findElements(this.el, 'col')
    this.innerEls = findElements(
      this.el.querySelector('tr:last-child') as HTMLElement, // compound selector won't work because of query-root problem
      'th .fc-cell-text'
    )
  }

}


