import { CssDimValue } from '@fullcalendar/core'
import {
  BaseComponent, multiplyDuration, RefMap,
  ScrollResponder, ScrollRequest,
  MaybeZonedMarker,
} from '@fullcalendar/core/internal'
import { createElement, createRef, VNode } from '@fullcalendar/core/preact'
import { TimelineCoords } from './TimelineCoords.js'
import { TimelineSlatsBody, TimelineSlatsContentProps } from './TimelineSlatsBody.js'

export interface TimelineSlatsProps extends TimelineSlatsContentProps {
  clientWidth: number | null
  tableMinWidth: CssDimValue
  tableColGroupNode: VNode
  onCoords?: (coord: TimelineCoords | null) => void
  onScrollLeftRequest?: (scrollLeft: number) => void
}

export class TimelineSlats extends BaseComponent<TimelineSlatsProps> {
  private rootElRef = createRef<HTMLDivElement>()
  private cellElRefs = new RefMap<HTMLTableCellElement>()
  private coords: TimelineCoords // for positionToHit
  private scrollResponder: ScrollResponder

  render() {
    let { props, context } = this

    return (
      <div className="fc-timeline-slots" ref={this.rootElRef}>
        <table
          aria-hidden
          className={context.theme.getClass('table')}
          style={{
            minWidth: props.tableMinWidth,
            width: props.clientWidth,
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

    this.scrollResponder.update(prevProps.dateProfile !== this.props.dateProfile)
  }

  componentWillUnmount() {
    this.scrollResponder.detach()

    if (this.props.onCoords) {
      this.props.onCoords(null)
    }
  }

  updateSizing() {
    let { props, context } = this

    if (
      props.clientWidth !== null && // is sizing stable?
      this.scrollResponder
      // ^it's possible to have clientWidth immediately after mount (when returning from print view), but w/o scrollResponder
    ) {
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

        this.scrollResponder.update(false) // TODO: wouldn't have to do this if coords were in state
      }
    }
  }

  handleScrollRequest = (request: ScrollRequest) => {
    let { onScrollLeftRequest } = this.props
    let { coords } = this

    if (onScrollLeftRequest && coords) {
      if (request.time) {
        let scrollLeft = coords.coordFromLeft(coords.durationToCoord(request.time))
        onScrollLeftRequest(scrollLeft)
      }
      return true
    }

    return null // best?
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
        tDateProfile.slotDates[slatIndex].marker, // TODO: use the timeZoneOffset somehow!!!
        multiplyDuration(tDateProfile.snapDuration, localSnapIndex),
      )
      let end = dateEnv.add(start, tDateProfile.snapDuration)

      return {
        dateSpan: {
          // TODO: send the offset somehow!!!
          start: { marker: start },
          end: { marker: end },
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

/*
TODO: DRY with TimelineSlatsBody key-generation
*/
function collectCellEls(elMap: { [key: string]: HTMLElement }, slotDates: MaybeZonedMarker[]) {
  return slotDates.map((slotDate) => {
    const { marker, timeZoneOffset } = slotDate
    const key = marker.toISOString() + (timeZoneOffset || '')
    return elMap[key]
  })
}
