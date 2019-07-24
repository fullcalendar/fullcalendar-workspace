import { DateSpan } from '@fullcalendar/core'

export function transformExternalDef(dateSpan: DateSpan) {
  return dateSpan.resourceId ?
    { resourceId: dateSpan.resourceId } :
    {}
}
