import {
  ViewProps, ViewPropsTransformer, CalendarContentProps,
  EventStore, EventUi, EventDef, CalendarContext,
} from '@fullcalendar/preact/protected-api'
import { ResourceHash } from './structs/resource'
import { ResourceEntityExpansions } from './reducers/resourceEntityExpansions'
import { computeResourceEditable } from './EventDragging'

// for when resource views need resource data

export interface ResourceViewProps extends ViewProps {
  resourceStore: ResourceHash
  rawEventStore: EventStore // unlike ViewProps.eventStore, has no interaction-mirror substitutions
  resourceEntityExpansions: ResourceEntityExpansions
}

/*
passes the raw resource data through. each view applies its own filterResourcesWithEvents
filtering via resource/common/resource-filtering.ts, using the raw event store so
resource visibility stays stable during drag mirrors
*/
export class ResourceDataAdder implements ViewPropsTransformer {
  transform(viewProps: ViewProps, calendarProps: CalendarContentProps) {
    if (calendarProps.viewSpec.optionDefaults.needsResourceData) {
      return {
        resourceStore: calendarProps.resourceStore,
        rawEventStore: calendarProps.eventStore,
        resourceEntityExpansions: calendarProps.resourceEntityExpansions,
      }
    }
    return null
  }
}

/*
for making sure events that have editable resources are always draggable in resource views
*/
export function transformIsDraggable(val: boolean, eventDef: EventDef, eventUi: EventUi, context: CalendarContext) {
  if (!val) {
    let state = context.getCurrentData()
    let viewSpec = state.viewSpecs[state.currentViewType]

    if (viewSpec.optionDefaults.needsResourceData) {
      if (computeResourceEditable(eventDef, context)) {
        return true
      }
    }
  }

  return val
}
