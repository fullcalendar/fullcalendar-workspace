import {
  h, View, ViewProps, ComponentContext, memoize, ChunkContentCallbackArgs, createRef, ViewRoot
} from '@fullcalendar/core'
import { buildTimelineDateProfile, TimelineDateProfile } from './timeline-date-profile'
import TimelineHeader from './TimelineHeader'
import { ScrollGrid } from '@fullcalendar/scrollgrid'
import TimelineGrid from './TimelineGrid'
import TimelineCoords from './TimelineCoords'


interface TimelineViewState {
  slatCoords?: TimelineCoords
}


export default class TimelineView extends View<TimelineViewState> { // would make this abstract, but TS complains

  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private scrollGridRef = createRef<ScrollGrid>()


  render(props: ViewProps, state: TimelineViewState, context: ComponentContext) {
    let { options } = context
    let { dateProfile } = props

    let tDateProfile = this.buildTimelineDateProfile(
      dateProfile,
      context.dateEnv,
      options,
      props.dateProfileGenerator
    )

    let extraClassNames = getTimelineViewClassNames(options.eventOverlap)
    let slatCols = buildSlatCols(tDateProfile, context.options.slotWidth || 30) // TODO: more DRY

    return (
      <ViewRoot viewSpec={props.viewSpec}>
        {(rootElRef, classNames) => (
          <div ref={rootElRef} class={extraClassNames.concat(classNames).join(' ')}>
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
                        slatCoords={state.slatCoords}
                      />
                    )
                  }]
                },
                {
                  type: 'body',
                  vGrow: true,
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
                        onSlatCoords={this.handleSlatCoords}
                        onScrollLeftRequest={this.handleScrollLeftRequest}
                      />
                    )
                  }]
                }
              ]}
            />
          </div>
        )}
      </ViewRoot>
    )
  }


  handleSlatCoords = (slatCoords: TimelineCoords | null) => {
    this.setState({ slatCoords })
  }


  handleScrollLeftRequest = (scrollLeft: number) => {
    let scrollGrid = this.scrollGridRef.current
    scrollGrid.forceScrollLeft(0, scrollLeft)
  }

}


export function getTimelineViewClassNames(eventOverlap) {
  let classNames = [ 'fc-timeline' ]

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
