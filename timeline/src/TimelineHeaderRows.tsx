import {
  h, asRoughMs, isSingleDay, BaseComponent, ComponentContext, DateProfile, GotoAnchor, Fragment, DateRange, DateMarker, getDayMeta, getDayClassNames, getDateMeta, getSlatClassNames
} from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'


export interface TimelineHeaderRowsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
}

export default class TimelineHeaderRows extends BaseComponent<TimelineHeaderRowsProps> {


  render(props: TimelineHeaderRowsProps, state: {}, context: ComponentContext) {
    let { dateEnv, options } = context
    let { tDateProfile } = props
    let { cellRows } = tDateProfile
    let isChrono = asRoughMs(tDateProfile.labelInterval) > asRoughMs(tDateProfile.slotDuration)
    let isSlotOneDay = isSingleDay(tDateProfile.slotDuration)

    return (
      <Fragment>
        {cellRows.map((rowCells, i) => {
          let isLast = i === cellRows.length - 1

          return (
            <tr class={isChrono && isLast ? 'fc-chrono' : ''}>
              {rowCells.map((cell) => {
                let headerCellClassNames: string[]

                if (isSlotOneDay) {
                  headerCellClassNames = getDayClassNames(
                    getDayMeta(cell.date, props.todayRange),
                    context.theme
                  )

                } else {
                  headerCellClassNames = getSlatClassNames(
                    getDateMeta(cell.date, props.todayRange, props.nowDate),
                    context.theme
                  )
                }

                if (cell.isWeekStart) {
                  headerCellClassNames.push('fc-em-cell')
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
