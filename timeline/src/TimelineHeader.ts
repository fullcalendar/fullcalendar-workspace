import { asRoughMs, isSingleDay, findElements, createElement, removeElement, getDayClasses, Component, ComponentContext, DateProfile } from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'

export interface TimelineHeaderProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
}

export default class TimelineHeader extends Component<TimelineHeaderProps> {

  parentEl: HTMLElement
  tableEl: HTMLElement
  slatColEls: HTMLElement[]
  innerEls: HTMLElement[]

  constructor(parentEl: HTMLElement) {
    super()

    this.parentEl = parentEl
  }

  firstContext(context: ComponentContext) {
    this.parentEl.appendChild(
      this.tableEl = createElement('table', {
        className: context.theme.getClass('tableGrid')
      })
    )
  }

  destroy() {
    removeElement(this.tableEl)

    super.destroy()
  }

  render(props: TimelineHeaderProps) {
    this.renderDates(props.tDateProfile)
  }

  renderDates(tDateProfile: TimelineDateProfile) {
    let { dateEnv, theme } = this.context
    let { cellRows } = tDateProfile
    let lastRow = cellRows[cellRows.length - 1]
    let isChrono = asRoughMs(tDateProfile.labelInterval) > asRoughMs(tDateProfile.slotDuration)
    let oneDay = isSingleDay(tDateProfile.slotDuration)

    let html = '<colgroup>'

    // needs to be a col for each body slat. header cells will have colspans
    for (let i = tDateProfile.slotCnt - 1; i >= 0; i--) {
      html += '<col/>'
    }

    html += '</colgroup>'
    html += '<tbody>'

    for (let rowCells of cellRows) {
      let isLast = rowCells === lastRow

      html += '<tr' + (isChrono && isLast ? ' class="fc-chrono"' : '') + '>'

      for (let cell of rowCells) {
        let headerCellClassNames = [ theme.getClass('widgetHeader') ]

        if (cell.isWeekStart) {
          headerCellClassNames.push('fc-em-cell')
        }
        if (oneDay) {
          headerCellClassNames = headerCellClassNames.concat(
            getDayClasses(cell.date, this.props.dateProfile, this.context, true) // adds "today" class and other day-based classes
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
      this.tableEl.querySelector<HTMLElement>('tr:last-child'), // compound selector won't work because of query-root problem
      'th .fc-cell-text'
    )

    findElements(
      this.tableEl.querySelectorAll('tr:not(:last-child)'), // compound selector won't work because of query-root problem
      'th .fc-cell-text'
    ).forEach(function(innerEl) {
      innerEl.classList.add('fc-sticky')
    })
  }

}


