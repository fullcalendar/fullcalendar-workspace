import { Hit } from '@fullcalendar/core'

export function transformDateSelectionJoin(hit0: Hit, hit1: Hit) {
  let resourceId0 = hit0.dateSpan.resourceId
  let resourceId1 = hit1.dateSpan.resourceId

  if (resourceId0 && resourceId1) {

    if (
      (hit0.component as any).allowAcrossResources === false &&
      resourceId0 !== resourceId1
    ) {
      return false
    } else {
      return { resourceId: resourceId0 }
    }
  }
}
