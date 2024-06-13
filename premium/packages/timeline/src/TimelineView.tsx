import { ViewProps, memoize, ViewContainer, DateComponent } from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { ScrollGrid } from '@fullcalendar/scrollgrid/internal'
import { buildTimelineDateProfile, TimelineDateProfile } from './timeline-date-profile.js'
import { TimelineHeader } from './TimelineHeader.js'
import { TimelineGrid } from './TimelineGrid.js'
import { TimelineCoords } from './TimelineCoords.js'

interface TimelineViewState {
  slatCoords: TimelineCoords | null
  slotCushionMaxWidth: number | null
}

export class TimelineView extends DateComponent<ViewProps, TimelineViewState> {
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private scrollGridRef = createRef<ScrollGrid>()

  state = {
    slatCoords: null,
    slotCushionMaxWidth: null,
  }

  render() {
    let { props, state, context } = this
    let { options } = context

    let tDateProfile = this.buildTimelineDateProfile(
      props.dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )

    let { slotMinWidth } = options
    let slatCols = buildSlatCols(tDateProfile, slotMinWidth || this.computeFallbackSlotMinWidth(tDateProfile))

    console.log('TODO use cols', slatCols)

    /*
    TODO:
    - forPrint
    - liquid(height) = !props.isHeightAuto && !props.forPrint
    - collapsibleWidth = false
    - stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    - stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)
    */
    return (
      <ViewContainer
        elClasses={[
          'fc-timeline',
          options.eventOverlap === false ?
            'fc-timeline-overlap-disabled' :
            '',
        ]}
        viewSpec={context.viewSpec}
      >
        <div>
          <TimelineHeader
            dateProfile={props.dateProfile}
            tDateProfile={tDateProfile}
            slatCoords={state.slatCoords}
            onMaxCushionWidth={slotMinWidth ? null : this.handleMaxCushionWidth}
          />
          <TimelineGrid
            {...props}
            tDateProfile={tDateProfile}
            onSlatCoords={this.handleSlatCoords}
            onScrollLeftRequest={this.handleScrollLeftRequest}
          />
        </div>
      </ViewContainer>
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
      slotCushionMaxWidth: Math.ceil(slotCushionMaxWidth), // for less rerendering TODO: DRY
    })
  }

  computeFallbackSlotMinWidth(tDateProfile: TimelineDateProfile) { // TODO: duplicate definition
    return Math.max(30, ((this.state.slotCushionMaxWidth || 0) / tDateProfile.slotsPerLabel))
  }
}

export function buildSlatCols(tDateProfile: TimelineDateProfile, slotMinWidth?: number) {
  return [{
    span: tDateProfile.slotCnt,
    minWidth: slotMinWidth || 1, // needs to be a non-zero number to trigger horizontal scrollbars!??????
  }]
}
