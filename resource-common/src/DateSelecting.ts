import { Hit } from '@fullcalendar/common'

export function transformDateSelectionJoin(hit0: Hit, hit1: Hit) {
  let resourceId0 = hit0.dateSpan.resourceId
  let resourceId1 = hit1.dateSpan.resourceId

  if (resourceId0 && resourceId1) {
    return { resourceId: resourceId0 }
  }

  return null
}
