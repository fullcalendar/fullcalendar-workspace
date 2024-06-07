import {
  SplittableProps, EventStore, BaseComponent, RefMap,
  DateMarker, DateRange, DateProfile,
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { GroupNode, ResourceNode } from '@fullcalendar/resource/internal'
import { TimelineDateProfile, TimelineCoords } from '@fullcalendar/timeline/internal'
import { ResourceTimelineLane } from './ResourceTimelineLane.js'
import { DividerRow } from './DividerRow.js'
import { RowSyncer } from './RowSyncer.js'

export interface ResourceTimelineLanesBodyProps extends ResourceTimelineLanesContentProps {
  rowElRefs: RefMap<HTMLElement> // indexed by NUMERICAL INDEX, not node.id
}

export interface ResourceTimelineLanesContentProps {
  rowNodes: (GroupNode | ResourceNode)[]
  splitProps: { [resourceId: string]: SplittableProps }
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  fallbackBusinessHours: EventStore | null
  slatCoords: TimelineCoords | null
  rowSyncer: RowSyncer
}

export class ResourceTimelineLanesBody extends BaseComponent<ResourceTimelineLanesBodyProps> { // TODO: this technique more
  render() {
    let { props, context } = this
    let { rowElRefs } = props

    return (
      <tbody>
        {props.rowNodes.map((node, index) => {
          if ((node as GroupNode).group) {
            return (
              <DividerRow
                key={node.id}
                elRef={rowElRefs.createRef(node.id)}
                groupValue={(node as GroupNode).group.value}
                renderHooks={(node as GroupNode).group.spec}
                rowSyncer={props.rowSyncer}
              />
            )
          }

          if ((node as ResourceNode).resource) {
            let resource = (node as ResourceNode).resource

            return (
              <ResourceTimelineLane
                key={node.id}
                elRef={rowElRefs.createRef(node.id)}
                {...props.splitProps[resource.id]}
                resource={resource}
                dateProfile={props.dateProfile}
                tDateProfile={props.tDateProfile}
                nowDate={props.nowDate}
                todayRange={props.todayRange}
                nextDayThreshold={context.options.nextDayThreshold}
                businessHours={resource.businessHours || props.fallbackBusinessHours}
                timelineCoords={props.slatCoords}
                rowSyncer={props.rowSyncer}
              />
            )
          }

          return null
        })}
      </tbody>
    )
  }
}
