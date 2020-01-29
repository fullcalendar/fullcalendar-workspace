import {
  h, View, ViewProps, ComponentContext, Duration, memoize, subrenderer, ViewSpec, getViewClassNames, ChunkContentCallbackArgs, DateMarker, NowTimer, createRef, rangeContainsMarker
} from '@fullcalendar/core'
import { buildTimelineDateProfile, TimelineDateProfile } from './timeline-date-profile'
import TimelineHeader from './TimelineHeader'
import { getTimelineNowIndicatorUnit } from './util'
import { ScrollGrid } from '@fullcalendar/scrollgrid'
import TimelineGrid from './TimelineGrid'
import TimelineCoords from './TimelineCoords'


interface TimelineViewState {
  nowIndicatorDate: DateMarker
  coords?: TimelineCoords
}


export default class TimelineView extends View<TimelineViewState> {

  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private scrollGridRef = createRef<ScrollGrid>()
  private tDateProfile: TimelineDateProfile
  private updateNowTimer = subrenderer(NowTimer)
  private queuedScrollDuration?: Duration


  render(props: ViewProps, state: TimelineViewState, context: ComponentContext) {
    let { options } = context
    let { dateProfile } = props

    let tDateProfile = this.tDateProfile = this.buildTimelineDateProfile(
      dateProfile,
      context.dateEnv,
      options,
      props.dateProfileGenerator
    )

    let classNames = getTimelineViewClassNames(props.viewSpec, options.eventOverlap)
    let slatCols = buildSlatCols(tDateProfile, context.options.slotWidth || 30) // TODO: more DRY

    let nowCoords = (
      state.nowIndicatorDate &&
      rangeContainsMarker(dateProfile.currentRange, state.nowIndicatorDate) &&
      state.coords
    ) ?
      state.coords.dateToCoord(state.nowIndicatorDate) :
      null

    return (
      <div class={classNames.join(' ')}>
        <ScrollGrid
          ref={this.scrollGridRef}
          forceSizingReady={Boolean(state.coords)}
          forPrint={props.forPrint}
          vGrow={!props.isHeightAuto}
          colGroups={[
            { cols: slatCols }
          ]}
          sections={[
            {
              type: 'head',
              chunks: [{
                className: 'fc-time-area',
                content: (contentArg: ChunkContentCallbackArgs) => (
                  <TimelineHeader
                    {...contentArg}
                    dateProfile={dateProfile}
                    tDateProfile={tDateProfile}
                    nowCoord={nowCoords}
                  />
                )
              }]
            },
            {
              type: 'body',
              vGrow: true,
              vGrowRows: true, // activates tableHeight :(
              chunks: [{
                className: 'fc-time-area',
                content: (contentArg: ChunkContentCallbackArgs) => (
                  <TimelineGrid
                    {...props}
                    {...contentArg}
                    tDateProfile={tDateProfile}
                    nowCoord={nowCoords}
                    onCoords={this.handleCoords}
                  />
                )
              }]
            }
          ]}
        />
      </div>
    )
  }


  handleCoords = (coords: TimelineCoords | null) => {
    this.setState({ coords })
  }


  componentDidMount() {
    this.subrender()
    this.scrollToInitialTime() // a REQUEST, goes to scrollToTime
    this.drainScroll()
  }


  componentDidUpdate(prevProps: ViewProps, prevState: TimelineViewState) {
    this.subrender()

    if (this.props.dateProfile !== prevProps.dateProfile) {
      this.scrollToInitialTime() // a REQUEST, goes to scrollToTime
    }

    this.drainScroll()
  }


  componentWillUnmount() {
    this.subrenderDestroy()
  }


  subrender() {
    this.updateNowTimer({ // TODO: componentize
      enabled: this.context.options.nowIndicator,
      unit: getTimelineNowIndicatorUnit(this.tDateProfile), // expensive operation?
      callback: this.handleNowDate
    })
  }


  handleNowDate = (date: DateMarker) => {
    this.setState({
      nowIndicatorDate: date
    })
  }


  scrollToTime(duration: Duration) { // API for caller
    this.queuedScrollDuration = duration
    this.drainScroll()
  }


  drainScroll() { // assumes scrollGridRef
    let { queuedScrollDuration } = this
    let { coords } = this.state

    if (queuedScrollDuration && coords) {
      let scrollLeft = coords.computeDurationLeft(queuedScrollDuration)
      this.scrollGridRef.current.forceScrollLeft(0, scrollLeft)
      this.queuedScrollDuration = null
    }
  }

}


export function getTimelineViewClassNames(viewSpec: ViewSpec, eventOverlap) {
  let classNames = getViewClassNames(viewSpec).concat('fc-timeline')

  if (eventOverlap === false) {
    classNames.push('fc-no-overlap')
  }

  return classNames
}


export function buildSlatCols(tDateProfile: TimelineDateProfile, slotMinWidth?: number) {
  return [ {
    span: tDateProfile.slotCnt,
    minWidth: slotMinWidth || 1 // needs to be a non-zero number to trigger horizontal scrollbars!??????
  } ]
}
