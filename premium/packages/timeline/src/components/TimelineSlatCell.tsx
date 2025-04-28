import { SlotLaneContentArg } from '@fullcalendar/core'
import {
  BaseComponent,
  ContentContainer,
  DateMarker,
  DateProfile,
  DateRange, getDateMeta,
  isInt,
  joinArrayishClassNames,
  joinClassNames,
  memoize,
  setRef,
  watchWidth
} from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
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

  // ref
  innerWidthRef?: Ref<number>
}

export class TimelineSlatCell extends BaseComponent<TimelineSlatCellProps> {
  // memo
  private getDateMeta = memoize(getDateMeta)

  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerWidth?: () => void

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

    let renderProps: SlotLaneContentArg = {
      ...dateMeta,
      isMajor,
      isMinor,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        tag="div"
        // fcu-align-start shrinks width of InnerContent
        className={joinClassNames(
          'fcu-tight fcu-flex-col fcu-align-start',
          props.borderStart ? 'fcu-border-only-s' : 'fcu-border-none',
          'fci-timeline-slot',
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
        generatorName="slotLaneContent"
        customGenerator={options.slotLaneContent}
        classNameGenerator={options.slotLaneClassNames}
        didMount={options.slotLaneDidMount}
        willUnmount={options.slotLaneWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            tag="div"
            className={joinArrayishClassNames(
              options.slotLaneInnerClassNames,
              'fcu-rigid',
            )}
            style={{
              // HACK for Safari 16.4,
              // which can't use ResizeObserver on elements with natural width 0
              minWidth: 1,
            }}
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
