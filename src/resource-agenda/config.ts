import { createPlugin, ViewSpec, AgendaView, assignTo } from 'fullcalendar'
import ResourceAgendaView from './ResourceAgendaView'
import { isVResourceViewEnabled } from '../common/resource-day-table'

function transformViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === AgendaView && isVResourceViewEnabled(viewSpec)) {
    return assignTo({}, viewSpec, {
      class: ResourceAgendaView
    })
  }

  return viewSpec
}

export default createPlugin({
  viewSpecTransformers: [ transformViewSpec ]
})
