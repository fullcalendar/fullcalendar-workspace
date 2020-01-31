import {
  h, ComponentContext, DateProfileGenerator, DateProfile, PositionCache,
  Duration, EventStore, DateSpan, EventUiHash, EventInteractionState, DateComponent, Hit, createRef, CssDimValue, VNode, DateMarker
} from '@fullcalendar/core'
import { ResourceHash, GroupNode, ResourceNode, ResourceSplitter } from '@fullcalendar/resource-common'
import { TimelineDateProfile, TimelineCoords, TimelineSlats, TimelineLaneSlicer, TimelineLaneBg, TimelineLaneSeg } from '@fullcalendar/timeline'
import ResourceTimelineLanes from './ResourceTimelineLanes'


export interface ResourceTimelineGridProps {
  tDateProfile: TimelineDateProfile
  dateProfile: DateProfile
  dateProfileGenerator: DateProfileGenerator
  rowNodes: (GroupNode | ResourceNode)[]
  businessHours: EventStore | null
  dateSelection: DateSpan | null
  eventStore: EventStore
  eventUiBases: EventUiHash
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  resourceStore: ResourceHash
  nextDayThreshold: Duration
  clientWidth: CssDimValue
  clientHeight: CssDimValue
  tableMinWidth: CssDimValue
  tableColGroupNode: VNode
  vGrowRows: boolean
  rowInnerHeights: number[]
  nowIndicatorDate: DateMarker | null
  onSlatCoords?: (slatCoords: TimelineCoords) => void
  onRowCoords?: (rowCoords: PositionCache) => void
  onScrollLeftRequest?: (scrollLeft: number) => void
}

interface ResourceTimelineGridState {
  slatCoords: TimelineCoords
}


export default class ResourceTimelineGrid extends DateComponent<ResourceTimelineGridProps, ResourceTimelineGridState> {

  private resourceSplitter = new ResourceSplitter() // doesn't let it do businessHours tho
  private bgSlicer = new TimelineLaneSlicer()
  private slatsRef = createRef<TimelineSlats>() // needed for Hit creation :(
  private rowCoords: PositionCache // for queryHit


  render(props: ResourceTimelineGridProps, state: ResourceTimelineGridState, context: ComponentContext) {
    let { dateProfile, tDateProfile } = props

    let splitProps = this.resourceSplitter.splitProps(props)
    let bgLaneProps = splitProps['']
    let bgSlicedProps = this.bgSlicer.sliceProps(
      bgLaneProps,
      props.dateProfile,
      tDateProfile.isTimeScale ? null : props.nextDayThreshold,
      context.calendar,
      props.dateProfile,
      props.dateProfileGenerator,
      tDateProfile,
      context.dateEnv
    )

    let nowIndicatorLeft = state.slatCoords && state.slatCoords.safeDateToCoord(props.nowIndicatorDate)

    return (
      <div ref={this.handleEl} style={{
        // weird. TODO: give an actual classname
        position: 'relative',
        minWidth: props.tableMinWidth,
        minHeight: '100%'
      }}>
        <TimelineSlats
          ref={this.slatsRef}
          dateProfile={dateProfile}
          tDateProfile={tDateProfile}
          clientWidth={props.clientWidth}
          tableColGroupNode={props.tableColGroupNode}
          tableMinWidth={props.tableMinWidth}
          onCoords={this.handleSlatCoords}
          onScrollLeftRequest={props.onScrollLeftRequest}
        />
        <TimelineLaneBg
          businessHourSegs={bgSlicedProps.businessHourSegs}
          bgEventSegs={bgSlicedProps.bgEventSegs}
          timelineCoords={state.slatCoords}
          dateSelectionSegs={bgSlicedProps.dateSelectionSegs}
          eventResizeSegs={(bgSlicedProps.eventResize ? bgSlicedProps.eventResize.segs : []) as TimelineLaneSeg[]}
        />
        <ResourceTimelineLanes
          rowNodes={props.rowNodes}
          dateProfile={props.dateProfile}
          dateProfileGenerator={props.dateProfileGenerator}
          tDateProfile={props.tDateProfile}
          splitProps={splitProps}
          businessHours={props.businessHours}
          clientWidth={props.clientWidth}
          minHeight={props.vGrowRows ? props.clientHeight : ''}
          tableMinWidth={props.tableMinWidth}
          innerHeights={props.rowInnerHeights}
          slatCoords={state.slatCoords}
          onRowCoords={this.handleRowCoords}
        />
        {nowIndicatorLeft != null &&
          <div
            class='fc-now-indicator fc-now-indicator-line'
            style={{ left: nowIndicatorLeft }}
          />
        }
      </div>
    )
  }


  handleEl = (el: HTMLElement | null) => {
    if (el) {
      this.context.calendar.registerInteractiveComponent(this, { el })
    } else {
      this.context.calendar.unregisterInteractiveComponent(this)
    }
  }


  handleSlatCoords = (slatCoords: TimelineCoords | null) => {
    this.setState({ slatCoords })

    if (this.props.onSlatCoords) {
      this.props.onSlatCoords(slatCoords)
    }
  }


  handleRowCoords = (rowCoords: PositionCache | null) => {
    this.rowCoords = rowCoords

    if (this.props.onRowCoords) {
      this.props.onRowCoords(rowCoords)
    }
  }


  // Hit System
  // ------------------------------------------------------------------------------------------


  queryHit(positionLeft: number, positionTop: number): Hit {
    let rowCoords = this.rowCoords
    let rowIndex = rowCoords.topToIndex(positionTop)

    if (rowIndex != null) {
      let resource = (this.props.rowNodes[rowIndex] as ResourceNode).resource

      if (resource) { // not a group
        let slatHit = this.slatsRef.current.positionToHit(positionLeft)

        if (slatHit) {
          return {
            component: this,
            dateSpan: {
              range: slatHit.dateSpan.range,
              allDay: slatHit.dateSpan.allDay,
              resourceId: resource.id
            },
            rect: {
              left: slatHit.left,
              right: slatHit.right,
              top: rowCoords.tops[rowIndex],
              bottom: rowCoords.bottoms[rowIndex]
            },
            dayEl: slatHit.dayEl,
            layer: 0
          }
        }
      }
    }
  }

}
