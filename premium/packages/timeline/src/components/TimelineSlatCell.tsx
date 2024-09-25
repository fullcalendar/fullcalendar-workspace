import { SlotLaneContentArg } from '@fullcalendar/core'
import {
  isInt, BaseComponent, DateMarker, DateRange, getDateMeta, getSlotClassNames,
  getDayClassNames, DateProfile, ContentContainer,
  watchWidth,
  setRef,
} from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from '../timeline-date-profile.js'

export interface TimelineSlatCellProps {
  date: DateMarker
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  isDay: boolean
  isEm: boolean

  // dimensions
  width: number | undefined // always provided. if pending, use `undefined`

  // ref
  innerWidthRef?: Ref<number>
}

export class TimelineSlatCell extends BaseComponent<TimelineSlatCellProps> {
  // ref
  private innerElRef = createRef<HTMLElement>()

  // internal
  private detachWidth?: () => void

  render() {
    let { props, context } = this
    let { dateEnv, options, theme } = context
    let { date, tDateProfile, isEm } = props
    let dateMeta = getDateMeta(props.date, props.todayRange, props.nowDate, props.dateProfile)
    let renderProps: SlotLaneContentArg = {
      date: dateEnv.toDate(props.date),
      ...dateMeta,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        elTag="div"
        elClasses={[
          'fcnew-cell',
          'fcnew-timeline-slot',
          'fcnew-timeline-slot-lane',
          isEm ? 'fcnew-timeline-slot-em' : '', // TODO: document this semantic className
          tDateProfile.isTimeScale ? (
            isInt(dateEnv.countDurationsBetween( // best to do this here?
              tDateProfile.normalizedRange.start,
              props.date,
              tDateProfile.labelInterval,
            )) ?
              'fcnew-timeline-slot-major' :
              'fcnew-timeline-slot-minor'
          ) : '',
          ...(
            props.isDay ?
              getDayClassNames(dateMeta, theme) :
              getSlotClassNames(dateMeta, theme)
          ),
        ]}
        elAttrs={{
          'data-date': dateEnv.formatIso(date, {
            omitTimeZoneOffset: true,
            omitTime: !tDateProfile.isTimeScale,
          }),
        }}
        elStyle={{
          width: props.width,
        }}
        renderProps={renderProps}
        generatorName="slotLaneContent"
        customGenerator={options.slotLaneContent}
        classNameGenerator={options.slotLaneClassNames}
        didMount={options.slotLaneDidMount}
        willUnmount={options.slotLaneWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            elTag="div"
            elRef={this.innerElRef} // TODO: is thie correct element? should we want a "frame"?
          />
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current

    this.detachWidth = watchWidth(innerEl, (width) => {
      setRef(this.props.innerWidthRef, width)
    })
  }

  componentWillUnmount(): void {
    this.detachWidth()
  }
}
