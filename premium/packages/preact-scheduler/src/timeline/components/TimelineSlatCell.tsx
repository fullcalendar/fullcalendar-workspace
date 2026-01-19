import { SlotLaneData, joinClassNames } from '@fullcalendar/preact'
import {
  BaseComponent,
  ContentContainer,
  DateMarker,
  DateProfile,
  DateRange, getDateMeta,
  isInt,
  memoize
} from '@fullcalendar/preact/internal'
import classNames from '@fullcalendar/preact/internal-classnames'
import { TimelineDateProfile } from '../timeline-date-profile'

export interface TimelineSlatCellProps {
  key?: string | number | null

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

    let isMinor =
      tDateProfile.isTimeScale &&
      !isInt(dateEnv.countDurationsBetween(
        tDateProfile.normalizedRange.start,
        props.date,
        tDateProfile.labelInterval,
      ))

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
