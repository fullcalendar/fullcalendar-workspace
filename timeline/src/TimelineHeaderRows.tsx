import {
  h, asRoughMs, isSingleDay, getDayClasses, BaseComponent, ComponentContext, DateProfile, GotoAnchor, Fragment
} from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'


export interface TimelineHeaderRowsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
}

export default class TimelineHeaderRows extends BaseComponent<TimelineHeaderRowsProps> {


  render(props: TimelineHeaderRowsProps, state: {}, context: ComponentContext) {
    let { dateEnv, options } = context
    let { tDateProfile, dateProfile } = props
    let { cellRows } = tDateProfile
    let isChrono = asRoughMs(tDateProfile.labelInterval) > asRoughMs(tDateProfile.slotDuration)
    let oneDay = isSingleDay(tDateProfile.slotDuration)

    return (
      <Fragment>
        {cellRows.map((rowCells, i) => {
          let isLast = i === cellRows.length - 1

          return (
            <tr class={isChrono && isLast ? 'fc-chrono' : ''}>
              {rowCells.map((cell) => {
                let headerCellClassNames = []

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
                    <div class="fc-cell-content" data-fc-width-all={1}>
                      <GotoAnchor
                        navLinks={options.navLinks}
                        gotoOptions={{
                          date: cell.date,
                          type: cell.rowUnit,
                          forceOff: !cell.rowUnit
                        }}
                        extraAttrs={{
                          'class': 'fc-cell-text' + (isLast ? '' : ' fc-sticky'),
                          'data-fc-width-content': 1
                        }}
                      >{cell.text}</GotoAnchor>
                    </div>
                  </th>
                )
              })}
            </tr>
          )
        })}
      </Fragment>
    )
  }

}
