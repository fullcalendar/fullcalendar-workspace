import { DateSpan } from 'fullcalendar'

export function transformExternalDef(dateSpan: DateSpan) {
  return dateSpan.resourceId ?
    { resourceId: dateSpan.resourceId } :
    {}
}
