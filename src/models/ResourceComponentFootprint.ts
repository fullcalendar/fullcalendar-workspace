import { ComponentFootprint } from 'fullcalendar'


export default class ResourceComponentFootprint extends ComponentFootprint {

  resourceId: string


  constructor(unzonedRange, allDay, resourceId) {
    super(unzonedRange, allDay)
    this.resourceId = resourceId
  }


  toLegacy(calendar) {
    const obj = super.toLegacy(calendar);
    (obj as any).resource = calendar.getResourceById(this.resourceId)
    return obj
  }

}
