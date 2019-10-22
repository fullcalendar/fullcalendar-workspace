import { asRoughMs, isSingleDay, findElements, createElement, getDayClasses, Component, ComponentContext, DateProfile } from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'

export interface TimelineHeaderProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
}

export default class TimelineHeader extends Component<TimelineHeaderProps> {

  slatColEls: HTMLElement[]
  innerEls: HTMLElement[]


  render(props: TimelineHeaderProps, context: ComponentContext) {

    let tableEl = createElement('table', {
      className: context.theme.getClass('tableGrid')
    }, renderTableHtml(
      props.dateProfile,
      props.tDateProfile,
      context
    ))

    this.slatColEls = findElements(tableEl, 'col')

    this.innerEls = findElements(
      tableEl.querySelector<HTMLElement>('tr:last-child'), // compound selector won't work because of query-root problem
      'th .fc-cell-text'
    )

    findElements(
      tableEl.querySelectorAll('tr:not(:last-child)'), // compound selector won't work because of query-root problem
      'th .fc-cell-text'
    ).forEach(function(innerEl) {
      innerEl.classList.add('fc-sticky')
    })

    return tableEl
  }

}


function renderTableHtml(dateProfile: DateProfile, tDateProfile: TimelineDateProfile, context: ComponentContext) {
  let { dateEnv, theme } = context
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
          getDayClasses(cell.date, dateProfile, context, true) // adds "today" class and other day-based classes
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

  return html
}
