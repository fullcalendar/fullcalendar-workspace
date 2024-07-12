import { DateComponent, DateMarker, DateProfile } from "@fullcalendar/core/internal";
import { createElement } from '@fullcalendar/core/preact'
import { ResourceDayGridHeaderCells, buildCellTuples } from "./ResourceDayGridHeaderCells.js";
import { Resource } from '@fullcalendar/resource/internal'

export interface ResourceDayGridHeaderProps {
  resources: Resource[]
  dateProfile: DateProfile
  dates: DateMarker[]
  datesAboveResources: boolean
  datesRepDistinctDays: boolean
  colWidth?: number
}

export class ResourceDayGridHeader extends DateComponent<ResourceDayGridHeaderProps> {
  render() {
    let { props, context } = this
    let headerTuples = buildCellTuples( // TODO: memoize
      props.resources,
      props.dates,
      props.datesAboveResources,
      props.datesRepDistinctDays,
      context,
    )

    return (
      <div>
        {headerTuples.map((headerTuple, i) => (
          <div>
            <ResourceDayGridHeaderCells
              dateProfile={props.dateProfile}
              cellTuple={headerTuple}
              colWidth={props.colWidth}
              isSticky={i !== headerTuples.length}
            />
          </div>
        ))}
      </div>
    )
  }
}
