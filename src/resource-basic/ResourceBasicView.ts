import { BasicView } from 'fullcalendar'
import { default as ResourceViewMixin, ResourceViewInterface } from '../ResourceViewMixin'
import ResourceDayGrid from './ResourceDayGrid'


export default class ResourceBasicView extends BasicView {

  initResourceView: ResourceViewInterface['initResourceView']

  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)
    this.initResourceView()
  }

}

ResourceBasicView.prototype.dayGridClass = ResourceDayGrid

ResourceViewMixin.mixInto(ResourceBasicView)
