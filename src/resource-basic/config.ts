import { createPlugin, ViewDef, BasicView } from 'fullcalendar'
import ResourceBasicView from './ResourceBasicView'

function transformViewDef(viewDef: ViewDef, overrides): ViewDef {

  if (viewDef.class === BasicView && overrides.resources) {
    return {
      type: viewDef.type,
      class: ResourceBasicView,
      overrides: viewDef.overrides,
      defaults: viewDef.defaults
    }
  }

  return viewDef
}

export default createPlugin({
  viewDefTransformers: [ transformViewDef ]
})
