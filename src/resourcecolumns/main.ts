import { createPlugin, ViewSpec } from 'fullcalendar'
import { BasicView } from 'fullcalendar-basic'
import { AgendaView } from 'fullcalendar-agenda'
import ResourceAgendaView from './resource-agenda/ResourceAgendaView'
import ResourceBasicView from './resource-basic/ResourceBasicView'
import { isVResourceViewEnabled } from './resource-day-table'


function transformBasicViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === BasicView && isVResourceViewEnabled(viewSpec)) {
    return {
      ...viewSpec,
      class: ResourceBasicView
    }
  }

  return viewSpec
}


function transformAgendaViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === AgendaView && isVResourceViewEnabled(viewSpec)) {
    return {
      ...viewSpec,
      class: ResourceAgendaView
    }
  }

  return viewSpec
}


export { ResourceAgendaView, ResourceBasicView }

export default createPlugin({
  viewSpecTransformers: [ transformBasicViewSpec, transformAgendaViewSpec ]
})
