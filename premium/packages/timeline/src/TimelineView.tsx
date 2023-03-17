import {
  ViewProps, memoize, ChunkContentCallbackArgs, ViewContainer,
  DateComponent, ScrollGridSectionConfig, renderScrollShim, getStickyHeaderDates, getStickyFooterScrollbar,
} from '@fullcalendar/core/internal'
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

export class TimelineView extends DateComponent<ViewProps, TimelineViewState> { // would make this abstract, but TS complains
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private scrollGridRef = createRef<ScrollGrid>()

  state = {
    slatCoords: null,
    slotCushionMaxWidth: null,
  }

  render() {
    let { props, state, context } = this
    let { options } = context
    let stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    let stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    let tDateProfile = this.buildTimelineDateProfile(
      props.dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )

    let { slotMinWidth } = options
    let slatCols = buildSlatCols(tDateProfile, slotMinWidth || this.computeFallbackSlotMinWidth(tDateProfile))

    let sections: ScrollGridSectionConfig[] = [
      {
        type: 'header',
        key: 'header',
        isSticky: stickyHeaderDates,
        chunks: [{
          key: 'timeline',
          content: (contentArg: ChunkContentCallbackArgs) => (
            <TimelineHeader
              dateProfile={props.dateProfile}
              clientWidth={contentArg.clientWidth}
              clientHeight={contentArg.clientHeight}
              tableMinWidth={contentArg.tableMinWidth}
              tableColGroupNode={contentArg.tableColGroupNode}
              tDateProfile={tDateProfile}
              slatCoords={state.slatCoords}
              onMaxCushionWidth={slotMinWidth ? null : this.handleMaxCushionWidth}
            />
          ),
        }],
      },
      {
        type: 'body',
        key: 'body',
        liquid: true,
        chunks: [{
          key: 'timeline',
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
          ),
        }],
      },
    ]

    if (stickyFooterScrollbar) {
      sections.push({
        type: 'footer',
        key: 'footer',
        isSticky: true,
        chunks: [{
          key: 'timeline',
          content: renderScrollShim,
        }],
      })
    }

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
        <ScrollGrid
          ref={this.scrollGridRef}
          liquid={!props.isHeightAuto && !props.forPrint}
          forPrint={props.forPrint}
          collapsibleWidth={false}
          colGroups={[
            { cols: slatCols },
          ]}
          sections={sections}
        />
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
