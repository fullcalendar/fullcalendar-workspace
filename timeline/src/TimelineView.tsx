import {
  h, View, ViewProps, ComponentContext, memoize, subrenderer, ViewSpec, getViewClassNames, ChunkContentCallbackArgs, DateMarker, NowTimer, createRef
} from '@fullcalendar/core'
import { buildTimelineDateProfile, TimelineDateProfile } from './timeline-date-profile'
import TimelineHeader from './TimelineHeader'
import { getTimelineNowIndicatorUnit } from './util'
import { ScrollGrid } from '@fullcalendar/scrollgrid'
import TimelineGrid from './TimelineGrid'
import TimelineCoords from './TimelineCoords'


interface TimelineViewState {
  nowIndicatorDate: DateMarker
  slatCoords?: TimelineCoords
}


export default class TimelineView extends View<TimelineViewState> { // would make this abstract, but TS complains

  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private scrollGridRef = createRef<ScrollGrid>()
  private tDateProfile: TimelineDateProfile
  private updateNowTimer = subrenderer(NowTimer)


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

    return (
      <div class={classNames.join(' ')}>
        <ScrollGrid
          ref={this.scrollGridRef}
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
                    clientWidth={contentArg.clientWidth}
                    clientHeight={contentArg.clientHeight}
                    tableMinWidth={contentArg.tableMinWidth}
                    tableColGroupNode={contentArg.tableColGroupNode}
                    dateProfile={dateProfile}
                    tDateProfile={tDateProfile}
                    nowIndicatorDate={state.nowIndicatorDate}
                    slatCoords={state.slatCoords}
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
                    clientWidth={contentArg.clientWidth}
                    clientHeight={contentArg.clientHeight}
                    tableMinWidth={contentArg.tableMinWidth}
                    tableColGroupNode={contentArg.tableColGroupNode}
                    tDateProfile={tDateProfile}
                    nowIndicatorDate={state.nowIndicatorDate}
                    onSlatCoords={this.handleSlatCoords}
                    onScrollLeft={this.handleScrollLeft}
                  />
                )
              }]
            }
          ]}
        />
      </div>
    )
  }


  handleSlatCoords = (slatCoords: TimelineCoords | null) => {
    this.setState({ slatCoords })
  }


  componentDidMount() {
    this.subrender()
  }


  componentDidUpdate() {
    this.subrender()
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


  handleScrollLeft = (scrollLeft: number) => {
    let scrollGrid = this.scrollGridRef.current
    scrollGrid.forceScrollLeft(0, scrollLeft)
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
