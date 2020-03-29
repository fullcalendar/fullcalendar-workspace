import {
  h, BaseComponent, DateProfile, multiplyDuration,
  ComponentContext, RefMap, CssDimValue, VNode, createRef, ScrollResponder, ScrollRequest, DateMarker, DateRange
} from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'
import TimelineSlatCell from './TimelineSlatCell'
import TimelineCoords from './TimelineCoords'


export interface TimelineSlatsProps extends TimelineSlatsContentProps {
  clientWidth: number | null
  tableMinWidth: CssDimValue
  tableColGroupNode: VNode
  onCoords?: (coord: TimelineCoords | null) => void
  onScrollLeftRequest?: (scrollLeft: number) => void
}

interface TimelineSlatsContentProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
}


export default class TimelineSlats extends BaseComponent<TimelineSlatsProps> {

  private rootElRef = createRef<HTMLDivElement>()
  private cellElRefs = new RefMap<HTMLTableCellElement>()
  private coords: TimelineCoords // for positionToHit
  private scrollResponder: ScrollResponder


  render(props: TimelineSlatsProps, state: {}, context: ComponentContext) {
    let { theme } = context

    return (
      <div class='fc-timeline-slots' ref={this.rootElRef}>
        <table
          class={theme.getClass('table')}
          style={{
            minWidth: props.tableMinWidth,
            width: props.clientWidth
          }}
        >
          {props.tableColGroupNode}
          <TimelineSlatsBody
            cellElRefs={this.cellElRefs}
            dateProfile={props.dateProfile}
            tDateProfile={props.tDateProfile}
            nowDate={props.nowDate}
            todayRange={props.todayRange}
          />
        </table>
      </div>
    )
  }


  componentDidMount() {
    this.updateSizing()
    this.scrollResponder = this.context.createScrollResponder(this.handleScrollRequest)
  }


  componentDidUpdate(prevProps: TimelineSlatsProps) {
    this.updateSizing()
    this.scrollResponder.update(this.props.dateProfile !== prevProps.dateProfile)
  }


  componentWillUnmount() {
    this.scrollResponder.detach()

    if (this.props.onCoords) {
      this.props.onCoords(null)
    }
  }


  updateSizing() {
    let { props, context } = this

    if (props.clientWidth !== null) { // is sizing stable?

      this.coords = new TimelineCoords(
        this.rootElRef.current,
        this.cellElRefs.collect(),
        props.dateProfile,
        props.tDateProfile,
        context.dateEnv,
        context.isRtl
      )

      if (props.onCoords) {
        props.onCoords(this.coords)
      }

      this.scrollResponder.update(false) // TODO: wouldn't have to do this if coords were in state
    }
  }


  handleScrollRequest = (request: ScrollRequest) => {
    let { onScrollLeftRequest } = this.props
    let { coords } = this

    if (onScrollLeftRequest && coords) {
      if (request.time) {
        let scrollLeft = coords.computeDurationLeft(request.time)
        onScrollLeftRequest(scrollLeft)
      }
      return true
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


interface TimelineSlatsBodyProps extends TimelineSlatsContentProps {
  cellElRefs: RefMap<HTMLTableCellElement>
}


class TimelineSlatsBody extends BaseComponent<TimelineSlatsBodyProps> {


  render(props: TimelineSlatsBodyProps) {
    let { tDateProfile, cellElRefs } = props
    let { slotDates, isWeekStarts } = tDateProfile

    return (
      <tbody>
        <tr>
          {slotDates.map((slotDate, i) => (
            <TimelineSlatCell
              date={slotDate}
              dateProfile={props.dateProfile}
              tDateProfile={tDateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}
              isEm={isWeekStarts[i]}
              elRef={cellElRefs.createRef(i)}
            />
          ))}
        </tr>
      </tbody>
    )
  }

}
