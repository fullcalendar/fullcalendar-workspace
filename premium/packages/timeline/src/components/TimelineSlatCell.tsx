import { SlotLaneData } from '@fullcalendar/core'
import {
  BaseComponent,
  ContentContainer,
  DateMarker,
  DateProfile,
  DateRange, getDateMeta,
  isInt, joinClassNames,
  memoize
} from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from '../timeline-date-profile.js'

export interface TimelineSlatCellProps {
  date: DateMarker
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  isMajor: boolean
  borderStart: boolean

  // dimensions
  width: number | undefined // always provided. if pending, use `undefined`
}

export class TimelineSlatCell extends BaseComponent<TimelineSlatCellProps> {
  // memo
  private getDateMeta = memoize(getDateMeta)

  render() {
    let { props, context } = this
    let { dateEnv, options } = context
    let { date, tDateProfile, isMajor } = props
    let dateMeta = this.getDateMeta(props.date, dateEnv, props.dateProfile, props.todayRange, props.nowDate)

    let isMinor = !(
      tDateProfile.isTimeScale &&
      isInt(dateEnv.countDurationsBetween(
        tDateProfile.normalizedRange.start,
        props.date,
        tDateProfile.labelInterval,
      ))
    )

    let renderProps: SlotLaneData = {
      ...dateMeta,
      isMajor,
      isMinor,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        tag="div"
        className={joinClassNames(
          classNames.tight,
          classNames.flexCol,
          classNames.alignStart, // shrinks width of InnerContent
          props.borderStart ? classNames.borderOnlyS : classNames.borderNone,
          classNames.internalTimelineSlot,
        )}
        attrs={{
          'data-date': dateEnv.formatIso(date, {
            omitTimeZoneOffset: true,
            omitTime: !tDateProfile.isTimeScale,
          }),
          ...(dateMeta.isToday ? { 'aria-current': 'date' } : {}),
        }}
        style={{
          width: props.width,
        }}
        renderProps={renderProps}
        generatorName={undefined}
        classNameGenerator={options.slotLaneClass}
        didMount={options.slotLaneDidMount}
        willUnmount={options.slotLaneWillUnmount}
      />
    )
  }
}
