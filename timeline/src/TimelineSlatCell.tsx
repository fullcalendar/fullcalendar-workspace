import {
  h, isInt, BaseComponent,
  ComponentContext, DateMarker, Ref, DateRange, DateProfile, getDateMeta, getSlotClassNames, RenderHook
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
    let dateMeta = getDateMeta(props.date, props.todayRange, props.nowDate)
    let classNames = [ 'fc-timeline-slot', 'fc-timeline-slot-lane' ]
    let dataAttrs = { 'data-date': dateEnv.formatIso(date, { omitTimeZoneOffset: true }) }
    let mountProps = { date: dateEnv.toDate(props.date), view: context.view }
    let dynamicProps = { ...mountProps, ...dateMeta }

    if (isEm) {
      classNames.push('fc-timeline-slot-em')
    }

    if (tDateProfile.isTimeScale) {
      classNames.push(
        isInt(dateEnv.countDurationsBetween(
          tDateProfile.normalizedRange.start,
          props.date,
          tDateProfile.labelInterval
        )) ?
          'fc-timeline-slot-major' :
          'fc-timeline-slot-minor'
      )
    }

    classNames.push(...getSlotClassNames(dateMeta, context.theme))

    return (
      <RenderHook name='slotLane' mountProps={mountProps} dynamicProps={dynamicProps} elRef={props.elRef}>
        {(rootElRef, customClassNames, innerElRef, innerContent) => (
          <td
            ref={rootElRef}
            className={classNames.concat(customClassNames).join(' ')}
            {...dataAttrs}
          >
            <div ref={innerElRef}>{innerContent}</div>
          </td>
        )}
      </RenderHook>
    )
  }

}
