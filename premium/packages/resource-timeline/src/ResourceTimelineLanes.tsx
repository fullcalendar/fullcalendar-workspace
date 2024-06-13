import { CssDimValue } from '@fullcalendar/core'
import {
  SplittableProps, EventStore, BaseComponent,
  DateMarker, DateRange, DateProfile,
} from '@fullcalendar/core/internal'
import { Fragment, createElement } from '@fullcalendar/core/preact'
import { Group, Resource } from '@fullcalendar/resource/internal'
import { TimelineDateProfile, TimelineCoords } from '@fullcalendar/timeline/internal'
import { ResourceTimelineLane } from './ResourceTimelineLane.js'
import { DividerRow } from './DividerRow.js'
import { GroupRowDisplay, ResourceRowDisplay } from './resource-table.js'

export interface ResourceTimelineLanesProps {
  groupRowDisplays: GroupRowDisplay[]
  resourceRowDisplays: ResourceRowDisplay[]
  splitProps: { [resourceId: string]: SplittableProps }
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  fallbackBusinessHours: EventStore | null
  slatCoords: TimelineCoords | null
  verticalPositions: Map<Resource | Group, { top: number, height: number }>
  //
  minHeight: CssDimValue
  clientWidth: number | null
  tableMinWidth: CssDimValue
}

export class ResourceTimelineLanes extends BaseComponent<ResourceTimelineLanesProps> {
  render() {
    let { props, context } = this

    return (
      <table
        aria-hidden
        className={context.theme.getClass('table')}
        style={{
          minWidth: props.tableMinWidth,
          width: props.clientWidth,
          height: props.minHeight,
        }}
      >
        <tbody>
          <Fragment>
            {props.groupRowDisplays.map((groupRowDisplay) => (
              <DividerRow
                key={String(groupRowDisplay.group.value)}
                group={groupRowDisplay.group}
                top={props.verticalPositions.get(groupRowDisplay.group).top}
                height={props.verticalPositions.get(groupRowDisplay.group).height}
              />
            ))}
          </Fragment>
          <Fragment>
            {props.resourceRowDisplays.map((resourceRowDisplay) => {
              const { resource } = resourceRowDisplay
              return (
                <ResourceTimelineLane
                  key={resource.id}
                  {...props.splitProps[resource.id]}
                  resource={resource}
                  dateProfile={props.dateProfile}
                  tDateProfile={props.tDateProfile}
                  nowDate={props.nowDate}
                  todayRange={props.todayRange}
                  nextDayThreshold={context.options.nextDayThreshold}
                  businessHours={resource.businessHours || props.fallbackBusinessHours}
                  timelineCoords={props.slatCoords}
                  top={props.verticalPositions.get(resource).top}
                  height={props.verticalPositions.get(resource).height}
                />
              )
            })}
          </Fragment>
        </tbody>
      </table>
    )
  }
}
