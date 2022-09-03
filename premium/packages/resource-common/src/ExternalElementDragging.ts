import { DateSpan } from '@fullcalendar/common'

export function transformExternalDef(dateSpan: DateSpan) {
  return dateSpan.resourceId ?
    { resourceId: dateSpan.resourceId } :
    {}
}
