import { SlotLaneContentArg } from '@fullcalendar/core'
import {
  isInt, BaseComponent, DateMarker, DateRange, getDateMeta, getSlotClassNames,
  getDayClassNames, DateProfile, ContentContainer,
} from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from './timeline-date-profile.js'

export interface TimelineSlatCellProps {
  elRef?: Ref<HTMLTableCellElement>
  dateMarker: DateMarker
  timeZoneOffset: number | undefined // TODO: use this!
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  isDay: boolean
  isEm: boolean
}

export class TimelineSlatCell extends BaseComponent<TimelineSlatCellProps> {
  render() {
    let { props, context } = this
    let { dateEnv, options, theme } = context
    let { dateMarker, tDateProfile, isEm } = props
    let dateMeta = getDateMeta(props.dateMarker, props.todayRange, props.nowDate, props.dateProfile)
    let renderProps: SlotLaneContentArg = {
      date: dateEnv.toDate(props.dateMarker),
      ...dateMeta,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        elTag="td"
        elRef={props.elRef}
        elClasses={[
          'fc-timeline-slot',
          'fc-timeline-slot-lane',
          isEm && 'fc-timeline-slot-em',
          tDateProfile.isTimeScale ? (
            isInt(dateEnv.countDurationsBetween(
              tDateProfile.normalizedRange.start,
              dateMarker,
              tDateProfile.labelInterval,
            )) ?
              'fc-timeline-slot-major' :
              'fc-timeline-slot-minor'
          ) : '',
          ...(
            props.isDay ?
              getDayClassNames(dateMeta, theme) :
              getSlotClassNames(dateMeta, theme)
          ),
        ]}
        elAttrs={{
          'data-date': dateEnv.formatIso(dateMarker, {
            omitTimeZoneOffset: true,
            omitTime: !tDateProfile.isTimeScale,
          }),
        }}
        renderProps={renderProps}
        generatorName="slotLaneContent"
        customGenerator={options.slotLaneContent}
        classNameGenerator={options.slotLaneClassNames}
        didMount={options.slotLaneDidMount}
        willUnmount={options.slotLaneWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent elTag="div" />
        )}
      </ContentContainer>
    )
  }
}
