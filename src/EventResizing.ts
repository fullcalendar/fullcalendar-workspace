import { Hit } from 'fullcalendar';

export function transformEventResizeJoin(hit0: Hit, hit1: Hit): false | object {
  let component = hit0.component

  if (
    (component as any).allowEventResizeAcrossResources === false &&
    hit0.dateSpan.resourceId !== hit1.dateSpan.resourceId
  ) {
    return false
  }
}
