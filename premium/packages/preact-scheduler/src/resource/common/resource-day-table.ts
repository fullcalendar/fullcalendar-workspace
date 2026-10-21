import {
  CalendarContext, DateMarker, DateSpan, DayCol, DayTableCell, DayTableColumn, DayTableColumnGroup, DayTableKeying,
  DayTableModel, EventDef, Hit, KeylessRules, NO_PARTICIPANTS, buildModelFromCols,
} from '@fullcalendar/preact/protected-api'
import { ResourceApi } from '../api/ResourceApi'
import { Resource } from '../structs/resource'
import { HasEventsByDate } from './resource-filtering'

/*
The resource views' column model (dates above resources, resources above dates, or no resources),
built from the plain model's date columns. A resource column's entityKey is the resource id;
placeholder columns (a date no resource kept, or every column without resources) are keyless
and inert
*/

export interface ResourceDayTableColumn extends DayTableColumn {
  resource: Resource | null // the same as `entity`. for the header
}

export interface ResourceDayTableColumnGroup extends DayTableColumnGroup {
  resource?: Resource // resources above dates
  cols: ResourceDayTableColumn[]
}

export function buildResourceDayTable(
  dayTableModel: DayTableModel, // the plain one
  resources: Resource[],
  datesAboveResources: boolean,
  hasEventsByDate: HasEventsByDate | null,
  context: CalendarContext,
): DayTableModel {
  if (!resources.length) {
    return buildResourcelessDayTable(dayTableModel, context)
  }

  let groups = datesAboveResources
    ? buildDatesAboveResourcesGroups(dayTableModel.dayCols, resources, hasEventsByDate, context)
    : buildResourcesAboveDatesGroups(dayTableModel.dayCols, resources, hasEventsByDate, context)

  // per-date filtering asks a per-column question, so it's strictly finer than the view-wide
  // pass that produced `resources`. a resource can clear that and still match no column: its
  // only events fall on a hidden day, or outside every column's rendered range. if that's true
  // of every resource, every column is a placeholder (or there are none), so render plain day
  // columns instead, with no resource participating
  if (hasEventsByDate && !groups.some((group) => group.cols.some((col) => col.resource))) {
    return buildResourcelessDayTable(dayTableModel, context)
  }

  return finishModel(dayTableModel, groups, resources, false, context)
}

// dates over resources
function buildDatesAboveResourcesGroups(
  dayCols: DayCol[],
  resources: Resource[],
  hasEventsByDate: HasEventsByDate | null,
  context: CalendarContext,
): ResourceDayTableColumnGroup[] {
  // Day boundaries remain major even when filtering leaves only one resource.
  let hasMajor = dayCols.length > 1
  let groups: ResourceDayTableColumnGroup[] = []

  for (let dateI = 0; dateI < dayCols.length; dateI += 1) {
    let dayCol = dayCols[dateI]
    let groupI = groups.length
    let cols: ResourceDayTableColumn[] = []

    for (let resource of resources) {
      if (!hasEventsByDate || hasEventsByDate[dateI][resource.id]) {
        cols.push(buildResourceCol(dayCol, dateI, resource, hasMajor && cols.length === 0, groupI, context))
      }
    }

    if (!cols.length) {
      cols.push(buildPlaceholderCol(dayCol, dateI, hasMajor, groupI))
    }

    groups.push({ key: dayCol.date.toISOString(), date: dayCol.date, cols })
  }

  return groups
}

// resources over dates
function buildResourcesAboveDatesGroups(
  dayCols: DayCol[],
  resources: Resource[],
  hasEventsByDate: HasEventsByDate | null,
  context: CalendarContext,
): ResourceDayTableColumnGroup[] {
  let hasMajor = resources.length > 1 && dayCols.length > 1
  let groups: ResourceDayTableColumnGroup[] = []

  for (let resource of resources) {
    let groupI = groups.length
    let cols: ResourceDayTableColumn[] = []

    for (let dateI = 0; dateI < dayCols.length; dateI += 1) {
      if (!hasEventsByDate || hasEventsByDate[dateI][resource.id]) {
        cols.push(buildResourceCol(dayCols[dateI], dateI, resource, hasMajor && cols.length === 0, groupI, context))
      }
    }

    // a resource with no surviving date drops out of the header AND the body entirely, but it
    // still participates (its events, interactions and selection are sliced, and go nowhere).
    // intentional: a filtered view never shows a resource heading spanning zero columns
    if (cols.length) {
      groups.push({ key: resource.id, entity: resource, resource, cols })
    }
  }

  return groups
}

// no resources: every column a placeholder, nothing participates
function buildResourcelessDayTable(dayTableModel: DayTableModel, context: CalendarContext): DayTableModel {
  let cols = dayTableModel.dayCols.map((dayCol, dateI) => buildPlaceholderCol(dayCol, dateI, dayCol.isMajor, 0))

  return finishModel(dayTableModel, [{ key: '', cols }], NO_PARTICIPANTS as Resource[], true, context)
}

function finishModel(
  dayTableModel: DayTableModel,
  groups: ResourceDayTableColumnGroup[],
  participants: Resource[],
  isInert: boolean,
  context: CalendarContext,
): DayTableModel {
  // multi-row daygrid rebuilds the resource fields per row
  let cellRows = dayTableModel.rowCount === 1
    ? null
    : buildResourceCellRows(dayTableModel, [].concat(...groups.map((group) => group.cols)), context)

  return buildModelFromCols(
    dayTableModel.daySeries,
    dayTableModel.dayCols,
    dayTableModel.rowCount,
    groups,
    cellRows,
    participants,
    isInert,
  )
}

function buildResourceCol(
  dayCol: DayCol,
  dateI: number,
  resource: Resource,
  isMajor: boolean,
  groupI: number,
  context: CalendarContext,
): ResourceDayTableColumn {
  return {
    ...dayCol,
    ...buildResourceCellFields(resource, dayCol.date, context),
    dateI,
    entityKey: resource.id,
    entity: resource,
    resource,
    groupI,
    isMajor,
  }
}

function buildPlaceholderCol(dayCol: DayCol, dateI: number, isMajor: boolean, groupI: number): ResourceDayTableColumn {
  return {
    ...dayCol,
    dateI,
    isInert: true,
    attrs: { 'aria-disabled': true },
    entityKey: '',
    entity: null,
    resource: null,
    groupI,
    isMajor,
  }
}

function buildResourceCellRows(
  dayTableModel: DayTableModel,
  cols: ResourceDayTableColumn[],
  context: CalendarContext,
): DayTableCell[][] {
  let rows: DayTableCell[][] = []

  for (let row = 0; row < dayTableModel.rowCount; row += 1) {
    rows.push(cols.map((col) => {
      let sourceCell = dayTableModel.cellRows[row][col.dateI]
      let { date, isDisabled } = sourceCell
      let { resource } = col

      if (!resource) {
        return {
          key: date.toISOString(),
          date,
          isMajor: col.isMajor,
          isDisabled,
          isInert: true,
          attrs: { 'aria-disabled': true },
        }
      }

      return {
        ...buildResourceCellFields(resource, date, context),
        date,
        isMajor: col.isMajor,
        isDisabled,
      }
    }))
  }

  return rows
}

/*
What makes a day cell resource-specific. A fresh ResourceApi per cell is deliberate: in
multi-row daygrid the same column is rebuilt for each week row.
*/
function buildResourceCellFields(resource: Resource, date: DateMarker, context: CalendarContext) {
  return {
    key: resource.id + ':' + date.toISOString(),
    renderProps: { resource: new ResourceApi(context, resource) },
    attrs: { 'data-resource-id': resource.id },
    className: '',
    dateSpanProps: { resourceId: resource.id },
  }
}

// keying
// -------------------------------------------------------------------------------------------------

/*
Keyless things in resource views: fg events render nowhere (also without resources); bg events and
selections in every column; business hours in placeholders only (every resource has its own,
falling back to the calendar's); interaction segs in resource columns only, without their
metadata, and only alongside a resource's interaction
*/
export const RESOURCE_KEYLESS_RULES: KeylessRules = {
  fg: 'none',
  interactionSegs: 'keyedOnly',
  interactionMetadata: 'excluded',
  interactionActivation: 'keyedOnly',
  eventSelection: 'membership',
}

// from the model's participants, not the view's resources: the all-filtered fallback has none
export function buildResourceKeying(participants: Resource[]): DayTableKeying {
  let uiByKey = {}
  let businessHoursByKey = {}

  for (let resource of participants) {
    uiByKey[resource.id] = resource.ui
    businessHoursByKey[resource.id] = resource.businessHours
  }

  return {
    keys: participants.map((resource) => resource.id),
    keysForEventDef: getResourceKeysForEventDef,
    keyForDateSpan: getResourceKeyForDateSpan,
    uiByKey,
    businessHoursByKey,
    keylessRules: RESOURCE_KEYLESS_RULES,
  }
}

const NO_RESOURCE_KEYS = ['']

function getResourceKeysForEventDef(eventDef: EventDef): string[] {
  return eventDef.resourceIds.length ? eventDef.resourceIds : NO_RESOURCE_KEYS
}

function getResourceKeyForDateSpan(dateSpan: DateSpan): string {
  return dateSpan.resourceId || ''
}

/*
One-day views may select across resource columns (the first hit's resource is reported); otherwise
both hits must be in one resource. Dates missing a resource's column (filtered out) don't break the
span: the highlight simply skips them while the reported range stays continuous, like a hidden day
*/
export function isResourceHitComboAllowed(hit0: Hit, hit1: Hit, allowAcrossResources: boolean): boolean {
  return allowAcrossResources || hit0.dateSpan.resourceId === hit1.dateSpan.resourceId
}

// the header's view of a model
export interface ResourceHeaderInput {
  cols: { key: string, date: DateMarker, isMajor: boolean, resource: Resource | null }[]
  groups: { date?: DateMarker, resource?: Resource, cols: ResourceHeaderInput['cols'] }[]
  resourceCount: number
  dateCount: number
  datesAboveResources: boolean
}

export function toResourceHeaderInput(model: DayTableModel, datesAboveResources: boolean): ResourceHeaderInput {
  return {
    cols: model.cols as ResourceDayTableColumn[],
    groups: model.groups as ResourceDayTableColumnGroup[],
    resourceCount: model.participants.length,
    dateCount: model.dayCols.length,
    datesAboveResources,
  }
}
