import { createPlugin, ViewSpec } from 'fullcalendar'
import { isVResourceViewEnabled } from 'fullcalendar-resources'
import { AgendaView } from 'fullcalendar-agenda'
import ResourceAgendaView from './ResourceAgendaView'


function transformAgendaViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === AgendaView && isVResourceViewEnabled(viewSpec)) {
    return {
      ...viewSpec,
      class: ResourceAgendaView
    }
  }

  return viewSpec
}


export { ResourceAgendaView }

export default createPlugin({
  viewSpecTransformers: [ transformAgendaViewSpec ]
})
