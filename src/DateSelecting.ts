import { DateSpan } from 'fullcalendar'

export function transformDateSelection(finalSelection: DateSpan, span0: DateSpan, span1: DateSpan): boolean {
  let resource0 = span0.resourceId
  let resource1 = span1.resourceId

  if (resource0 && resource1) {

    if (resource0 !== resource1) {
      return false
    }

    finalSelection.resourceId = resource1
  }

  return true
}
