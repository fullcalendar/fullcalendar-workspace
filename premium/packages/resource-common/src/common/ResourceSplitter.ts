import { Splitter, SplittableProps, DateSpan, EventDef } from '@fullcalendar/common'
import { ResourceHash } from '../structs/resource'

export interface SplittableResourceProps extends SplittableProps {
  resourceStore: ResourceHash
}

/*
splits things BASED OFF OF which resources they are associated with.
creates a '' entry which is when something has NO resource.
*/
export class ResourceSplitter extends Splitter<SplittableResourceProps> {
  getKeyInfo(props: SplittableResourceProps) {
    return {
      '': {}, // needed for non-resource
      ...props.resourceStore, // already has `ui` and `businessHours` keys!
    }
  }

  getKeysForDateSpan(dateSpan: DateSpan): string[] {
    return [dateSpan.resourceId || '']
  }

  getKeysForEventDef(eventDef: EventDef): string[] {
    let resourceIds = eventDef.resourceIds

    if (!resourceIds.length) {
      return ['']
    }

    return resourceIds
  }
}
