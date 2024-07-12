import {
  BaseComponent,
  DateMarker,
  DateProfile,
  ViewContext
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { DateHeaderCellModel, DateHeaderCells, DayOfWeekHeaderCellModel, DayOfWeekHeaderCells } from '@fullcalendar/daygrid/internal'
import { ResourceApi } from '@fullcalendar/resource'
import { Resource } from '@fullcalendar/resource/internal'
import { ResourceHeaderCellModel } from './ResourceHeaderCell.js'
import { ResourceHeaderCells } from './ResourceHeaderCells.js'

export interface ResourceDayGridHeaderCellsProps {
  dateProfile: DateProfile
  cellTuple: ResourceDayGridHeaderCellTuple
  colWidth: number | undefined
  isSticky?: boolean
}

export class ResourceDayGridHeaderCells extends BaseComponent<ResourceDayGridHeaderCellsProps> {
  /*
  TODO: worry about keys within inner-component loops?
  */
  render() {
    let { props } = this
    let { cellTuple } = props
    let [ groupType, colSpan, cells ] = cellTuple

    if (groupType === 'date') {
      return (
        <DateHeaderCells
          cells={cells as DateHeaderCellModel[]}
          dateProfile={props.dateProfile}
          colSpan={colSpan}
          colWidth={props.colWidth}
          isSticky={props.isSticky}
        />
      )
    }

    if (groupType === 'dayOfWeek') {
      return (
        <DayOfWeekHeaderCells
          cells={cells as DayOfWeekHeaderCellModel[]}
          dateProfile={props.dateProfile}
          colSpan={colSpan}
          colWidth={props.colWidth}
          isSticky={props.isSticky}
        />
      )
    }

    return ( // groupType === 'resource'
      <ResourceHeaderCells
        cells={cells as ResourceHeaderCellModel[]}
        colSpan={colSpan}
        colWidth={props.colWidth}
        isSticky={props.isSticky}
      />
    )
  }
}

// Model (for MULTIPLE tuples) -- OLD!!!!
// -------------------------------------------------------------------------------------------------

export type ResourceDayGridHeaderCellTuple =
  | [type: 'resource', colSpan: number, cells: ResourceHeaderCellModel[]]
  | [type: 'date', colSpan: number, cells: DateHeaderCellModel[]]
  | [type: 'dayOfWeek', colSpan: number, cells: DayOfWeekHeaderCellModel[]]

export function buildCellTuples(
  resources: Resource[],
  dates: DateMarker[],
  datesAboveResources: boolean,
  datesRepDistinctDays: boolean,
  context: ViewContext,
): ResourceDayGridHeaderCellTuple[] {
  if (!resources.length) {
    return [
      datesRepDistinctDays
        ? ['date', 1, dates.map((date) => ({ date }))]
        : ['dayOfWeek', 1, dates.map((date) => ({ dow: date.getUTCDay() }))]
    ]
  }
  if (dates.length === 1) {
    return [
      ['resource', 1, resources.map((resource) => ({ resource, date: dates[0] }))]
    ]
  }
  if (datesAboveResources) {
    return [
      datesRepDistinctDays
        ? ['date', 1, dates.map((date) => ({ date }))]
        : ['dayOfWeek', 1, dates.map((date) => ({ dow: date.getUTCDay() }))],
      [
        'resource',
        dates.length,
        [].concat(
          ...dates.map((date) => (
            resources.map((resource) => (
              { resource, date: datesRepDistinctDays ? date : undefined }
            ))
          ))
        )
      ]
    ]
  }
  return [
    ['resource', 1, resources.map((resource) => ({ resource, date: dates[0] }))],
    datesRepDistinctDays
      ? [
        'date',
        resources.length,
        [].concat(
          ...resources.map((resource) => (
            dates.map((date) => (
              {
                date,
                extraRenderProps: { resource: new ResourceApi(context, resource) },
                extraDataAttrs: { 'data-resource-id': resource.id },
              }
            ))
          ))
        )
      ]
      : [
        'dayOfWeek',
        resources.length,
        [].concat(
          ...resources.map((resource) => (
            dates.map((date) => (
              {
                dow: date.getUTCDay(),
                extraRenderProps: { resource: new ResourceApi(context, resource) },
                extraDataAttrs: { 'data-resource-id': resource.id },
              }
            ))
          ))
        )
      ]
  ]
}

// Header Tiers
// -------------------------------------------------------------------------------------------------

export type HeaderTierCell =
  | ResourceHeaderCellModel & { type: 'resource', colSpan: number }
  | DateHeaderCellModel & { type: 'date', colSpan: number }
  | DayOfWeekHeaderCellModel & { type: 'dayOfWeek', colSpan: number }

export function buildHeaderTiers(
  resources: Resource[],
  dates: DateMarker[],
  datesAboveResources: boolean,
  datesRepDistinctDays: boolean,
  context: ViewContext,
): HeaderTierCell[][] {
  if (!resources.length) {
    return [
      datesRepDistinctDays
        ? dates.map((date) => ({ type: 'date', colSpan: 1, date }))
        : dates.map((date) => ({ type: 'dayOfWeek', colSpan: 1, dow: date.getUTCDay() }))
    ]
  }
  if (dates.length === 1) {
    return [
      resources.map((resource) => ({ type: 'resource', colSpan: 1, resource, date: dates[0] }))
    ]
  }
  if (datesAboveResources) {
    return [
      datesRepDistinctDays
        ? dates.map((date) => ({ type: 'date', colSpan: 1, date }))
        : dates.map((date) => ({ type: 'dayOfWeek', colSpan: 1, dow: date.getUTCDay() })),
      [].concat(
        ...dates.map((date) => (
          resources.map((resource) => (
            { type: 'resource', colSpan: dates.length, resource, date: datesRepDistinctDays ? date : undefined }
          ))
        ))
      )
    ]
  }
  return [
    resources.map((resource) => ({ type: 'resource', colSpan: 1, resource, date: dates[0] })),
    datesRepDistinctDays
      ? [].concat(
          ...resources.map((resource) => (
            dates.map((date) => (
              {
                type: 'date',
                colSpan: resources.length,
                date,
                extraRenderProps: { resource: new ResourceApi(context, resource) },
                extraDataAttrs: { 'data-resource-id': resource.id },
              }
            ))
          ))
        )
      : [].concat(
          ...resources.map((resource) => (
            dates.map((date) => (
              {
                type: 'dayOfWeek',
                colSpan: resources.length,
                dow: date.getUTCDay(),
                extraRenderProps: { resource: new ResourceApi(context, resource) },
                extraDataAttrs: { 'data-resource-id': resource.id },
              }
            ))
          ))
        )
  ]
}
