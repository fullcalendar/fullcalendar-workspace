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
Passes resource data through untouched. filterResourcesWithEvents is applied by each view
via resource/common/resource-filtering, so a view's whole visibility policy — view-wide and,
for the vertical views, per-date — lives in one place instead of straddling this transformer.
Views filter against rawEventStore so resources don't vanish while an event is being dragged.

CONSEQUENCE: declaring `needsResourceData` no longer buys a view filtering for free. A new
resource view must call filterResourceStore itself or filterResourcesWithEvents silently
does nothing for it.
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
