import {
  h, BaseComponent, DateProfile, multiplyDuration,
  ComponentContext, RefMap
} from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'
import TimelineSlatCell from './TimelineSlatCell'
import TimelineCoords from './TimelineCoords'


export interface TimelineSlatsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  onCoords?: (coord: TimelineCoords | null) => void
  allowSizing: boolean
}

export default class TimelineSlats extends BaseComponent<TimelineSlatsProps> {

  private cellElRefs = new RefMap<HTMLTableCellElement>()
  private coords: TimelineCoords


  render(props: TimelineSlatsProps, state: {}, context: ComponentContext) {
    let { dateProfile, tDateProfile } = props
    let { slotDates, isWeekStarts } = tDateProfile

    return (
      <tr>
        {slotDates.map((slotDate, i) => (
          <TimelineSlatCell
            date={slotDate}
            dateProfile={dateProfile}
            tDateProfile={tDateProfile}
            isEm={isWeekStarts[i]}
            elRef={this.cellElRefs.createRef(i)}
          />
        ))}
      </tr>
    )
  }


  componentDidMount() {
    this.handleSizing()
    this.context.addResizeHandler(this.handleSizing)
  }


  componentDidUpdate(prevProps) {
    this.handleSizing()
  }


  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
  }


  handleSizing = (forced?: boolean) => {

    if (this.props.allowSizing && !forced) {
      let slatEls = this.cellElRefs.collect()
      let slatRootEl = slatEls[0].parentNode as HTMLElement

      this.coords = new TimelineCoords(
        slatRootEl,
        slatEls,
        this.props.dateProfile,
        this.props.tDateProfile,
        this.context.dateEnv,
        this.context.isRtl
      )

    } else {
      this.coords = null
    }

    if (this.props.onCoords) {
      this.props.onCoords(this.coords)
    }
  }


  positionToHit(leftPosition) {
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
        multiplyDuration(tDateProfile.snapDuration, localSnapIndex)
      )
      let end = dateEnv.add(start, tDateProfile.snapDuration)

      return {
        dateSpan: {
          range: { start, end },
          allDay: !this.props.tDateProfile.isTimeScale
        },
        dayEl: this.cellElRefs.currentMap[slatIndex],
        left: outerCoordCache.lefts[slatIndex], // TODO: make aware of snaps?
        right: outerCoordCache.rights[slatIndex]
      }
    }

    return null
  }

}
