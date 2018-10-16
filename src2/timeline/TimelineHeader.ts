import { asRoughMs, isSingleDay, findElements, createElement, removeElement } from 'fullcalendar'
import SimpleComponent from './SimpleComponent'
import { TimelineDateProfile } from './timeline-date-profile'

export interface TimelineHeaderProps {
  tDateProfile: TimelineDateProfile
}

export default class TimelineHeader extends SimpleComponent {

  tableEl: HTMLElement
  slatColEls: HTMLElement[]
  innerEls: HTMLElement[]

  setParent(parentEl: HTMLElement) {
    parentEl.appendChild(
      this.tableEl = createElement('table', {
        className: this.getTheme().getClass('tableGrid')
      })
    )
  }

  removeElement() {
    removeElement(this.tableEl)
  }

  render(props: TimelineHeaderProps, forceFlags) {
    this.renderDates(props.tDateProfile)
  }

  renderDates(tDateProfile: TimelineDateProfile) {
    let dateEnv = this.getDateEnv()
    let theme = this.getTheme()
    let { cellRows } = tDateProfile
    let lastRow = cellRows[cellRows.length - 1]
    let isChrono = asRoughMs(tDateProfile.labelInterval) > asRoughMs(tDateProfile.slotDuration)
    let oneDay = isSingleDay(tDateProfile.slotDuration)

    let html = '<colgroup>'

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

    html += '</tbody>'

    this.tableEl.innerHTML = html // TODO: does this work cross-browser?

    this.slatColEls = findElements(this.tableEl, 'col')
    this.innerEls = findElements(
      this.tableEl.querySelector('tr:last-child') as HTMLElement, // compound selector won't work because of query-root problem
      'th .fc-cell-text'
    )
  }

}


