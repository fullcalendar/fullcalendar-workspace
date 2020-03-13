import {
  h, isInt, BaseComponent,
  ComponentContext, DateMarker, Ref, DateRange, DateProfile, DayRoot, DateTimeRoot
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
    let { date, tDateProfile, isEm } = props
    let extraClassNames: string[] = []

    const doRender = (rootElRef, classNames, dataAttrs, innerElRef, innerContent) => (
      <td
        ref={rootElRef}
        className={classNames.concat(extraClassNames).join(' ')}
        {...dataAttrs}
      >
        <div ref={innerElRef}>{innerContent}</div>
      </td>
    )

    if (isEm) {
      extraClassNames.push('fc-em-cell')
    }

    if (tDateProfile.isTimeScale) {
      extraClassNames.push(
        isInt(dateEnv.countDurationsBetween(
          tDateProfile.normalizedRange.start,
          props.date,
          tDateProfile.labelInterval
        )) ?
          'fc-major' :
          'fc-minor'
      )

      return (
        <DateTimeRoot date={date} nowDate={props.nowDate} classNameScope='fc-slat' elRef={props.elRef}>
          {doRender}
        </DateTimeRoot>
      )
    } else {
      return (
        <DayRoot date={date} todayRange={props.todayRange} elRef={props.elRef}>
          {doRender}
        </DayRoot>
      )
    }
  }

}
