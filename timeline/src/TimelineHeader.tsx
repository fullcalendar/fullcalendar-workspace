import {
  h, VNode,
  asRoughMs, isSingleDay, findElements, getDayClasses, BaseComponent, ComponentContext, DateProfile, guid
} from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'


export interface TimelineHeaderProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
}

export default class TimelineHeader extends BaseComponent<TimelineHeaderProps> {

  slatColEls: HTMLElement[]
  innerEls: HTMLElement[]


  render(props: TimelineHeaderProps, state: {}, context: ComponentContext) {
    let { dateEnv, theme } = context
    let { tDateProfile, dateProfile } = props
    let { cellRows } = tDateProfile
    let isChrono = asRoughMs(tDateProfile.labelInterval) > asRoughMs(tDateProfile.slotDuration)
    let oneDay = isSingleDay(tDateProfile.slotDuration)
    let colGroupNodes: VNode[] = []

    // needs to be a col for each body slat. header cells will have colspans
    for (let i = tDateProfile.slotCnt - 1; i >= 0; i--) {
      colGroupNodes.push(<col />)
    }

    return ( // guid rerenders whole DOM every time
      <table class={context.theme.getClass('tableGrid')} key={guid()} ref={this.handleRootEl}>
        <colgroup>
          {colGroupNodes}
        </colgroup>
        <tbody>
          {cellRows.map((rowCells, i) => {
            let isLast = i === cellRows.length - 1

            return (
              <tr class={isChrono && isLast ? 'fc-chrono' : ''}>
                {rowCells.map((cell) => {
                  let headerCellClassNames = [ theme.getClass('widgetHeader') ]

                  if (cell.isWeekStart) {
                    headerCellClassNames.push('fc-em-cell')
                  }

                  if (oneDay) {
                    headerCellClassNames = headerCellClassNames.concat(
                      getDayClasses(cell.date, dateProfile, context, true) // adds "today" class and other day-based classes
                    )
                  }

                  return (
                    <th class={headerCellClassNames.join(' ')}
                      data-date={dateEnv.formatIso(cell.date, { omitTime: !tDateProfile.isTimeScale, omitTimeZoneOffset: true })}
                      colSpan={cell.colspan}
                    >
                      <div class="fc-cell-content">
                        {cell.spanNode}
                      </div>
                    </th>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }


  handleRootEl = (rootEl: HTMLElement | null) => {
    if (rootEl) {
      let slatColEls = findElements(rootEl, 'col')

      let innerEls = findElements(
        rootEl.querySelector<HTMLElement>('tr:last-child'), // compound selector won't work because of query-root problem
        'th .fc-cell-text'
      )

      findElements(
        rootEl.querySelectorAll('tr:not(:last-child)'), // compound selector won't work because of query-root problem
        'th .fc-cell-text'
      ).forEach(function(innerEl) {
        innerEl.classList.add('fc-sticky')
      })

      this.slatColEls = slatColEls
      this.innerEls = innerEls
    }
  }

}
