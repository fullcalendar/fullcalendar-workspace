import {
  h, isInt, BaseComponent,
  ComponentContext, DateMarker, Ref, setRef, getDayClassNames, getSlatClassNames, DateRange, getDateMeta, getDayMeta, DateProfile
} from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'


export interface TimelineSlatCellProps {
  date: DateMarker
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  isEm: boolean
  elRef?: Ref<HTMLTableCellElement>
}


export default class TimelineSlatCell extends BaseComponent<TimelineSlatCellProps> {


  render(props: TimelineSlatCellProps, state: {}, context: ComponentContext) {
    let { dateEnv } = context
    let { date, tDateProfile, isEm } = props // TODO: destructure in signature! do elsewhere!
    let classNames: string[]

    if (tDateProfile.isTimeScale) {
      classNames = getSlatClassNames(
        getDateMeta(date, props.todayRange, props.nowDate),
        context.theme
      )

      classNames.push(
        isInt(dateEnv.countDurationsBetween(
          tDateProfile.normalizedRange.start,
          date,
          tDateProfile.labelInterval
        )) ?
          'fc-major' :
          'fc-minor'
      )

    } else {
      classNames = getDayClassNames(
        getDayMeta(date, props.todayRange, props.dateProfile),
        context.theme
      )
    }

    if (isEm) {
      classNames.push('fc-em-cell')
    }

    let dateStr = dateEnv.formatIso(date, { omitTime: !tDateProfile.isTimeScale, omitTimeZoneOffset: true })

    return (
      <td
        ref={this.handleEl}
        key={dateStr /* fresh rerender for new date, mostly because of dayRender */}
        data-date={dateStr}
        class={classNames.join(' ')}
      ><div /></td>
    )
  }


  handleEl = (el: HTMLElement | null) => {
    let { props } = this

    if (el) {
      let { calendar, view, dateEnv } = this.context

      calendar.publiclyTrigger('dayRender', [
        {
          date: dateEnv.toDate(props.date),
          el,
          view
        }
      ])
    }

    setRef(props.elRef, el)
  }

}
