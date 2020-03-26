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
  slotCushionMaxWidth?: number
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

    let extraClassNames = [
      'fc-timeline',
      options.eventOverlap === false ? 'fc-timeline-overlap-disabled' : ''
    ]

    let { slotMinWidth } = context.options
    let slatCols = buildSlatCols(tDateProfile, slotMinWidth || this.computeFallbackSlotMinWidth(tDateProfile))

    return (
      <ViewRoot viewSpec={props.viewSpec}>
        {(rootElRef, classNames) => (
          <div ref={rootElRef} class={extraClassNames.concat(classNames).join(' ')}>
            <ScrollGrid
              ref={this.scrollGridRef}
              forPrint={props.forPrint}
              liquid={!props.isHeightAuto}
              colGroups={[
                { cols: slatCols }
              ]}
              sections={[
                {
                  type: 'head',
                  chunks: [{
                    content: (contentArg: ChunkContentCallbackArgs) => (
                      <TimelineHeader
                        clientWidth={contentArg.clientWidth}
                        clientHeight={contentArg.clientHeight}
                        tableMinWidth={contentArg.tableMinWidth}
                        tableColGroupNode={contentArg.tableColGroupNode}
                        dateProfile={dateProfile}
                        tDateProfile={tDateProfile}
                        slatCoords={state.slatCoords}
                        onMaxCushionWidth={slotMinWidth ? null : this.handleMaxCushionWidth}
                      />
                    )
                  }]
                },
                {
                  type: 'body',
                  liquid: true,
                  chunks: [{
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


  handleMaxCushionWidth = (slotCushionMaxWidth) => {
    this.setState({
      slotCushionMaxWidth: Math.ceil(slotCushionMaxWidth) // for less rerendering TODO: DRY
    })
  }


  computeFallbackSlotMinWidth(tDateProfile: TimelineDateProfile) { // TODO: duplicate definition
    return Math.max(30, ((this.state.slotCushionMaxWidth || 0) / tDateProfile.slotsPerLabel))
  }

}


export function buildSlatCols(tDateProfile: TimelineDateProfile, slotMinWidth?: number) {
  return [ {
    span: tDateProfile.slotCnt,
    minWidth: slotMinWidth || 1 // needs to be a non-zero number to trigger horizontal scrollbars!??????
  } ]
}
