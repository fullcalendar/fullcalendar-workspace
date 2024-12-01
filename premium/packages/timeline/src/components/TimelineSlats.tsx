import {
  afterSize,
  BaseComponent, DateMarker,
  DateProfile,
  DateRange,
  RefMap,
  setRef,
} from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { TimelineSlatCell } from './TimelineSlatCell.js'
import { TimelineDateProfile } from '../timeline-date-profile.js'

export interface TimelineSlatsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange

  // dimensions
  height?: number
  slotWidth: number | undefined

  // ref
  innerWidthRef?: Ref<number>
}

export class TimelineSlats extends BaseComponent<TimelineSlatsProps> {
  private innerWidthRefMap = new RefMap<string, number>(() => { // keyed by isoStr
    afterSize(this.handleInnerWidths)
  })

  render() {
    let { props, innerWidthRefMap } = this
    let { tDateProfile, slotWidth } = props
    let { slotDates, isWeekStarts } = tDateProfile
    let isDay = !tDateProfile.isTimeScale && !tDateProfile.largeUnit

    return (
      <div
        className="fc-timeline-slots fc-fill fc-flex-row"
        style={{ height: props.height }}
      >
        {slotDates.map((slotDate, i) => {
          let key = slotDate.toISOString()

          return (
            <TimelineSlatCell
              key={key}
              date={slotDate}
              dateProfile={props.dateProfile}
              tDateProfile={tDateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}
              isEm={isWeekStarts[i]}
              isDay={isDay}
              borderStart={Boolean(i)}

              // ref
              innerWidthRef={innerWidthRefMap.createRef(key)}

              // dimensions
              width={slotWidth}
            />
          )
        })}
      </div>
    )
  }

  handleInnerWidths = () => {
    const innerWidthMap = this.innerWidthRefMap.current
    let max = 0

    for (const innerWidth of innerWidthMap.values()) {
      max = Math.max(max, innerWidth)
    }

    // TODO: check to see if changed before firing ref!? YES. do in other places too
    setRef(this.props.innerWidthRef, max)
  }
}
