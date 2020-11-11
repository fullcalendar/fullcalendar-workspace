import { EventDef, mapHash, Splitter, SplittableProps, DateSpan } from '@fullcalendar/common'
import { __assign } from 'tslib'
import { AbstractResourceDayTableModel } from './AbstractResourceDayTableModel'

// splitter

export interface VResourceProps extends SplittableProps {
  resourceDayTableModel: AbstractResourceDayTableModel
}

/*
TODO: just use ResourceHash somehow? could then use the generic ResourceSplitter
*/
export class VResourceSplitter extends Splitter<VResourceProps> {
  getKeyInfo(props: VResourceProps) {
    let { resourceDayTableModel } = props

    let hash = mapHash(
      resourceDayTableModel.resourceIndex.indicesById,
      (i) => resourceDayTableModel.resources[i], // has `ui` AND `businessHours` keys!
    ) as any // :(

    hash[''] = {}

    return hash
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
