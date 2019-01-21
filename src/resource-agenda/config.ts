import { createPlugin, ViewSpec } from 'fullcalendar'
import { AgendaView } from 'fullcalendar-agenda'
import ResourceAgendaView from './ResourceAgendaView'
import { isVResourceViewEnabled } from '../common/resource-day-table'

function transformViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === AgendaView && isVResourceViewEnabled(viewSpec)) {
    return {
      ...viewSpec,
      class: ResourceAgendaView
    }
  }

  return viewSpec
}

export default createPlugin({
  viewSpecTransformers: [ transformViewSpec ]
})
