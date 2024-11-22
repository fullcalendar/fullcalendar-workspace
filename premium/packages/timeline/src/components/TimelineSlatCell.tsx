import { SlotLaneContentArg } from '@fullcalendar/core'
import {
  isInt, BaseComponent, DateMarker, DateRange, getDateMeta, getSlotClassName,
  getDayClassName, DateProfile, ContentContainer,
  watchWidth,
  setRef,
  joinClassNames,
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
  borderStart: boolean

  // dimensions
  width: number | undefined // always provided. if pending, use `undefined`

  // ref
  innerWidthRef?: Ref<number>
}

export class TimelineSlatCell extends BaseComponent<TimelineSlatCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerWidth?: () => void

  render() {
    let { props, context } = this
    let { dateEnv, options } = context
    let { date, tDateProfile, isEm } = props
    let dateMeta = getDateMeta(props.date, props.todayRange, props.nowDate, props.dateProfile)
    let renderProps: SlotLaneContentArg = {
      date: dateEnv.toDate(props.date),
      ...dateMeta,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        tag="div"
        // fc-align-start shrinks width of InnerContent
        // TODO: document this semantic className fc-timeline-slot-em
        className={joinClassNames(
          'fc-timeline-slot',
          isEm && 'fc-timeline-slot-em',
          tDateProfile.isTimeScale && (
            isInt(dateEnv.countDurationsBetween( // best to do this here?
              tDateProfile.normalizedRange.start,
              props.date,
              tDateProfile.labelInterval,
            )) ?
              'fc-timeline-slot-major' :
              'fc-timeline-slot-minor'
          ),
          'fc-timeline-slot-lane fc-cell fc-flex-col fc-align-start',
          props.borderStart && 'fc-border-s',
          props.isDay ?
            getDayClassName(dateMeta) :
            getSlotClassName(dateMeta),
        )}
        attrs={{
          'data-date': dateEnv.formatIso(date, {
            omitTimeZoneOffset: true,
            omitTime: !tDateProfile.isTimeScale,
          }),
        }}
        style={{
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
            tag="div"
            className='fc-cell-inner'
            elRef={this.innerElRef}
          />
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current

    this.disconnectInnerWidth = watchWidth(innerEl, (width) => {
      setRef(this.props.innerWidthRef, width)
    })
  }

  componentWillUnmount(): void {
    this.disconnectInnerWidth()
    setRef(this.props.innerWidthRef, null)
  }
}
