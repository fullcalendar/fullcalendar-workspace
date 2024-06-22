import {
  BaseComponent, multiplyDuration, RefMap, DateMarker,
  DateProfile,
  DateRange,
} from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { TimelineCoords } from './TimelineCoords.js'
import { TimelineSlatCell } from './TimelineSlatCell.js'
import { TimelineDateProfile } from './timeline-date-profile.js'

export interface TimelineSlatsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  slotWidth: number | undefined
  onCoords?: (coord: TimelineCoords | null) => void
}

export class TimelineSlats extends BaseComponent<TimelineSlatsProps> {
  private rootElRef = createRef<HTMLDivElement>()
  private cellElRefs = new RefMap<HTMLTableCellElement>()
  private coords: TimelineCoords // for positionToHit

  render() {
    let { props } = this
    let { tDateProfile, slotWidth } = props
    let { slotDates, isWeekStarts } = tDateProfile
    let isDay = !tDateProfile.isTimeScale && !tDateProfile.largeUnit

    return (
      <div className="fc-timeline-slots" ref={this.rootElRef}>
        {slotDates.map((slotDate, i) => {
          let isLast = i === slotDates.length - 1
          let key = slotDate.toISOString()

          return (
            <TimelineSlatCell
              key={key}
              elRef={this.cellElRefs.createRef(key)}
              date={slotDate}
              dateProfile={props.dateProfile}
              tDateProfile={tDateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}
              isEm={isWeekStarts[i]}
              isDay={isDay}
              width={isLast ? undefined : slotWidth}
            />
          )
        })}
      </div>
    )
  }

  componentDidMount() {
    this.updateSizing()
  }

  componentDidUpdate(prevProps: TimelineSlatsProps) {
    this.updateSizing()
  }

  componentWillUnmount() {
    if (this.props.onCoords) {
      this.props.onCoords(null)
    }
  }

  updateSizing() {
    let { props, context } = this
    let rootEl = this.rootElRef.current

    if (rootEl.offsetWidth) { // not hidden by css
      this.coords = new TimelineCoords(
        this.rootElRef.current,
        collectCellEls(this.cellElRefs.currentMap, props.tDateProfile.slotDates),
        props.dateProfile,
        props.tDateProfile,
        context.dateEnv,
        context.isRtl,
      )

      if (props.onCoords) {
        props.onCoords(this.coords)
      }
    }
  }

  positionToHit(leftPosition) { // TODO: kill somehow
    let { outerCoordCache } = this.coords
    let { dateEnv, isRtl } = this.context
    let { tDateProfile } = this.props
    let slatIndex = outerCoordCache.leftToIndex(leftPosition)

    if (slatIndex != null) {
      // somewhat similar to what TimeGrid does. consolidate?
      let slatWidth = outerCoordCache.getWidth(slatIndex)
      let partial = isRtl ?
        (outerCoordCache.rights[slatIndex] - leftPosition) / slatWidth :
        (leftPosition - outerCoordCache.lefts[slatIndex]) / slatWidth
      let localSnapIndex = Math.floor(partial * tDateProfile.snapsPerSlot)
      let start = dateEnv.add(
        tDateProfile.slotDates[slatIndex],
        multiplyDuration(tDateProfile.snapDuration, localSnapIndex),
      )
      let end = dateEnv.add(start, tDateProfile.snapDuration)

      return {
        dateSpan: {
          range: { start, end },
          allDay: !this.props.tDateProfile.isTimeScale,
        },
        dayEl: this.cellElRefs.currentMap[slatIndex],
        left: outerCoordCache.lefts[slatIndex], // TODO: make aware of snaps?
        right: outerCoordCache.rights[slatIndex],
      }
    }

    return null
  }
}

function collectCellEls(elMap: { [key: string]: HTMLElement }, slotDates: DateMarker[]) {
  return slotDates.map((slotDate) => {
    let key = slotDate.toISOString()
    return elMap[key]
  })
}
