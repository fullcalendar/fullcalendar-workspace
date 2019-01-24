import { createPlugin, ViewSpec } from '@fullcalendar/core'
import { isVResourceViewEnabled } from '@fullcalendar/resource-common'
import { BasicView } from '@fullcalendar/daygrid'
import ResourceBasicView from './ResourceBasicView'


function transformBasicViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === BasicView && isVResourceViewEnabled(viewSpec)) {
    return {
      ...viewSpec,
      class: ResourceBasicView
    }
  }

  return viewSpec
}


export { ResourceBasicView }

export default createPlugin({
  viewSpecTransformers: [ transformBasicViewSpec ]
})
