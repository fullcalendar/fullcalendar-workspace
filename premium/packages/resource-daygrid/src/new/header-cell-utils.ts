import { DateMarker, ViewContext } from '@fullcalendar/core/internal'
import { ResourceApi } from '@fullcalendar/resource'
import { HeaderCellObj } from '@fullcalendar/daygrid/internal'
import { Resource } from '@fullcalendar/resource/internal'

export type ResourceDateHeaderCellObj = { resource: Resource, date?: DateMarker, colSpan: number }
export type ResourceHeaderCellObj = ResourceDateHeaderCellObj | HeaderCellObj

export function buildResourceHeaderTiers(
  resources: Resource[],
  dates: DateMarker[],
  datesAboveResources: boolean,
  datesRepDistinctDays: boolean,
  context: ViewContext,
): ResourceHeaderCellObj[][] {
  if (!resources.length) {
    return [
      datesRepDistinctDays
        ? dates.map((date) => ({ date, colSpan: 1 }))
        : dates.map((date) => ({ dow: date.getUTCDay(), colSpan: 1 }))
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
        ? dates.map((date) => ({ date, colSpan: 1 }))
        : dates.map((date) => ({ dow: date.getUTCDay(), colSpan: 1 })),
      [].concat(
        ...dates.map((date) => (
          resources.map((resource) => (
            { resource, date: datesRepDistinctDays ? date : undefined, colSpan: dates.length }
          ))
        ))
      )
    ]
  }
  return [
    resources.map((resource) => ({ resource, date: dates[0], colSpan: 1 })),
    datesRepDistinctDays
      ? [].concat(
          ...resources.map((resource) => (
            dates.map((date) => (
              {
                date,
                colSpan: resources.length,
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
                dow: date.getUTCDay(),
                colSpan: resources.length,
                extraRenderProps: { resource: new ResourceApi(context, resource) },
                extraDataAttrs: { 'data-resource-id': resource.id },
              }
            ))
          ))
        )
  ]
}
