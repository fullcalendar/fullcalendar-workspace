import { DateSpan } from '@fullcalendar/core/internal'

export function transformExternalDef(dateSpan: DateSpan) {
  return dateSpan.resourceId ?
    { resourceId: dateSpan.resourceId } :
    {}
}
