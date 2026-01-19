import { DateSpan } from '@fullcalendar/preact/internal'

export function transformExternalDef(dateSpan: DateSpan) {
  return dateSpan.resourceId ?
    { resourceId: dateSpan.resourceId } :
    {}
}
