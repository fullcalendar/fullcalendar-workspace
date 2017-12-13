import { MonthView } from 'fullcalendar'
import { default as ResourceViewMixin, ResourceViewInterface } from '../ResourceViewMixin'
import ResourceDayGrid from './ResourceDayGrid'


export default class ResourceMonthView extends MonthView {

  initResourceView: ResourceViewInterface['initResourceView']

  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)
    this.initResourceView()
  }

}

ResourceMonthView.prototype.dayGridClass = ResourceDayGrid

ResourceViewMixin.mixInto(ResourceMonthView)
