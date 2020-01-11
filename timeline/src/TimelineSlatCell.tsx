import {
  h, isInt, getDayClasses, BaseComponent, DateProfile,
  ComponentContext, DateMarker, Ref, setRef
} from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'


export interface TimelineSlatCellProps {
  date: DateMarker
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  isEm: boolean
  elRef?: Ref<HTMLTableCellElement>
}


export default class TimelineSlatCell extends BaseComponent<TimelineSlatCellProps> {


  render(props: TimelineSlatCellProps, state: {}, context: ComponentContext) {
    let { theme, dateEnv } = context
    let { date, dateProfile, tDateProfile, isEm } = props // TODO: destructure in signature! do elsewhere!
    let classes

    if (tDateProfile.isTimeScale) {
      classes = []
      classes.push(
        isInt(dateEnv.countDurationsBetween(
          tDateProfile.normalizedRange.start,
          date,
          tDateProfile.labelInterval
        )) ?
          'fc-major' :
          'fc-minor'
      )
    } else {
      classes = getDayClasses(date, dateProfile, context)
      classes.push('fc-day')
    }

    classes.unshift(theme.getClass('tableCellNormal'))

    if (isEm) {
      classes.push('fc-em-cell')
    }

    let dateStr = dateEnv.formatIso(date, { omitTime: !tDateProfile.isTimeScale, omitTimeZoneOffset: true })

    return (
      <td
        ref={this.handleEl}
        key={dateStr /* fresh rerender for new date, mostly because of dayRender */}
        data-date={dateStr}
        class={classes.join(' ')}
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
