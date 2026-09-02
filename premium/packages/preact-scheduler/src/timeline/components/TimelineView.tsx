import {
  ViewProps,
  memoize,
  DateComponent,
  greatestDurationDenominator,
  NowTimer,
  DateMarker,
  DateRange,
} from '@fullcalendar/preact/protected-api'
import { createRef } from 'react'
import { buildTimelineDateProfile } from '../timeline-date-profile'
import { computeSlotWidth } from '../timeline-positioning'
import { TimelineLaneSlicer } from '../TimelineLaneSlicer'
import { TimelineLayoutPrint } from './TimelineLayoutPrint'
import { TimelineLayoutNormal, TimelineScroll } from './TimelineLayoutNormal'

interface TimelineViewState {
  clientWidth?: number
  slotInnerWidth?: number
}

export class TimelineView extends DateComponent<ViewProps, TimelineViewState> {
  state = {} as TimelineViewState

  // memoized
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private computeSlotWidth = memoize(computeSlotWidth)

  // ref
  private scrollRef = createRef<TimelineScroll>()

  // internal
  private _isUnmounting: boolean
  private slicer = new TimelineLaneSlicer()

  render() {
    const { props, state, context } = this
    const { options } = context
    const { clientWidth } = state

    /* date */

    const tDateProfile = this.buildTimelineDateProfile(
      props.dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )
    let { unit: timerUnit, value: timerUnitValue } = greatestDurationDenominator(tDateProfile.slotDuration)

    /* table positions */

    const [canvasWidth, slotWidth] = this.computeSlotWidth(
      tDateProfile.slotCnt,
      tDateProfile.slotsPerLabel,
      options.slotMinWidth,
      state.slotInnerWidth, // is ACTUALLY the label width. rename?
      clientWidth,
    )

    /* sliced */

    let slicedProps = this.slicer.sliceProps(
      props,
      props.dateProfile,
      tDateProfile.isTimeScale ? null : options.nextDayThreshold,
      context, // wish we didn't have to pass in the rest of the args...
      props.dateProfile,
      context.dateProfileGenerator,
      tDateProfile,
      context.dateEnv,
    )

    return (
      <NowTimer unit={timerUnit} unitValue={timerUnitValue}>
        {(nowDate: DateMarker, todayRange: DateRange, nowMs: number) => {
          const baseProps = {
            className: props.className,
            dateProfile: props.dateProfile,
            tDateProfile,
            nowDate,
            nowMs,
            todayRange,
            slicedProps,
            canvasWidth,
            slotWidth,
          }

          return props.forPrint ? (
            <TimelineLayoutPrint
              {...baseProps}
              timeCanvasClipStart={this.scrollRef.current?.x ?? 0}
            />
          ) : (
            <TimelineLayoutNormal
              {...baseProps}
              clientWidth={clientWidth}
              clientWidthRef={this.handleClientWidth}
              slotInnerWidthRef={this.handleSlotInnerWidth}
              initialScroll={this.scrollRef.current ?? undefined}
              scrollRef={this.scrollRef}
            />
          )
        }}
      </NowTimer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this._isUnmounting = false
  }

  componentWillUnmount() {
    this._isUnmounting = true
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleSlotInnerWidth = (slotInnerWidth: number | null) => {
    if (this._isUnmounting) return
    if (slotInnerWidth != null && slotInnerWidth !== this.state.slotInnerWidth) {
      this.setState({ slotInnerWidth })
    }
  }

  handleClientWidth = (clientWidth: number | null) => {
    if (this._isUnmounting) return
    if (clientWidth != null && clientWidth !== this.state.clientWidth) {
      this.setState({ clientWidth })
    }
  }
}
