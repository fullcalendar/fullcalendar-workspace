import { createPlugin, ViewDef, AgendaView } from 'fullcalendar'
import ResourceAgendaView from './ResourceAgendaView'

function transformViewDef(viewDef: ViewDef, overrides): ViewDef {

  if (viewDef.class === AgendaView && overrides.resources) {
    return {
      type: viewDef.type,
      class: ResourceAgendaView,
      overrides: viewDef.overrides,
      defaults: viewDef.defaults
    }
  }

  return viewDef
}

export default createPlugin({
  viewDefTransformers: [ transformViewDef ]
})
