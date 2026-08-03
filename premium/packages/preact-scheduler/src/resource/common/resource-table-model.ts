import { CalendarContext, DayCol, DayTableModel } from '@fullcalendar/preact/protected-api'
import { Resource } from '../structs/resource'
import { AbstractResourceDayTableModel } from './AbstractResourceDayTableModel'
import { buildDayResourceTableModel } from './DayResourceTableModel'
import { buildResourceDayTableModel } from './ResourceDayTableModel'
import { buildResourcelessDayTableModel } from './ResourcelessDayTableModel'
import { HasEventsByDate } from './resource-filtering'

/*
TODO: kill this and DayResourceTableModel/ResourceDayTableModel/ResourcelessDayTableModel,
which differ only in column ordering and presence
*/
export function buildResourceTableModel(
  dayTableModel: DayTableModel | null, // only for multi-row daygrid
  dayCols: DayCol[],
  resources: Resource[],
  datesAboveResources: boolean,
  hasEventsByDate: HasEventsByDate | null,
  context: CalendarContext,
): AbstractResourceDayTableModel {
  if (!resources.length) {
    return buildResourcelessDayTableModel(dayTableModel, dayCols, context)
  }

  let model = datesAboveResources ?
    buildDayResourceTableModel(dayTableModel, dayCols, resources, context, hasEventsByDate) :
    buildResourceDayTableModel(dayTableModel, dayCols, resources, context, hasEventsByDate)

  // per-date filtering asks a per-column question, so it's strictly finer than the view-wide
  // pass that produced `resources`. a resource can clear that and still match no column — its
  // only events fall on a hidden day, or outside every column's rendered range. if that's true
  // of every resource there's nothing to show, so render plain day columns
  if (hasEventsByDate && !model.colCount) {
    return buildResourcelessDayTableModel(dayTableModel, dayCols, context)
  }

  return model
}
