import { ComponentFootprint } from 'fullcalendar'


export default class ResourceComponentFootprint extends ComponentFootprint {

  resourceId: string


  constructor(unzonedRange, isAllDay, resourceId) {
    super(unzonedRange, isAllDay)
    this.resourceId = resourceId
  }


  toLegacy(calendar) {
    const obj = super.toLegacy(calendar);
    (obj as any).resourceId = this.resourceId
    return obj
  }

}
