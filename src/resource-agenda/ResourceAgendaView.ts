import { AgendaView } from 'fullcalendar'
import { default as ResourceViewMixin, ResourceViewInterface } from '../ResourceViewMixin'
import ResourceDayGrid from '../resource-basic/ResourceDayGrid'
import ResourceTimeGrid from './ResourceTimeGrid'


export default class ResourceAgendaView extends AgendaView {

  initResourceView: ResourceViewInterface['initResourceView']

  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)
    this.initResourceView()
  }

}

ResourceAgendaView.prototype.timeGridClass = ResourceTimeGrid
ResourceAgendaView.prototype.dayGridClass = ResourceDayGrid

ResourceViewMixin.mixInto(ResourceAgendaView)
