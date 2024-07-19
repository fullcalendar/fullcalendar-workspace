import { DateMarker, ViewContext } from '@fullcalendar/core/internal'
import { ResourceApi } from '@fullcalendar/resource'
import { Resource } from '@fullcalendar/resource/internal'

export type HeaderTierCell =
  | { type: 'resource', resource: Resource, date?: DateMarker, colSpan: number }
  | { type: 'date', date: DateMarker, colSpan: number }
  | { type: 'dayOfWeek', dow: number, colSpan: number }

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
            { type: 'resource', resource, date: datesRepDistinctDays ? date : undefined, colSpan: dates.length }
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
