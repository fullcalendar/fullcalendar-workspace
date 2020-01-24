import {
  h, asRoughMs, isSingleDay, getDayClasses, BaseComponent, ComponentContext, DateProfile, GotoAnchor, wholeDivideDurations, findElements, Fragment,
  computeSmallestCellWidth
} from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'


export interface TimelineHeaderProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
}

export default class TimelineHeader extends BaseComponent<TimelineHeaderProps> {


  render(props: TimelineHeaderProps, state: {}, context: ComponentContext) {
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


export function computeDefaultSlotWidth(containerEl: HTMLElement, tDateProfile: TimelineDateProfile) {
  let maxInnerWidth = 0

  let cellEls = findElements(containerEl, 'th')
  cellEls.forEach(function(cellEl) {
    maxInnerWidth = Math.max(
      maxInnerWidth,
      computeSmallestCellWidth(cellEl)
    )
  })

  let headingCellWidth = Math.ceil(maxInnerWidth)

  // in TimelineView.defaults we ensured that labelInterval is an interval of slotDuration
  // TODO: rename labelDuration?
  let slotsPerLabel = wholeDivideDurations(tDateProfile.labelInterval, tDateProfile.slotDuration)

  let slotWidth = Math.ceil(headingCellWidth / slotsPerLabel)

  let minWidth: any = window.getComputedStyle(cellEls[0] as HTMLElement).minWidth
  if (minWidth) {
    minWidth = parseInt(minWidth, 10)
    if (minWidth) {
      slotWidth = Math.max(slotWidth, minWidth)
    }
  }

  return slotWidth
}
