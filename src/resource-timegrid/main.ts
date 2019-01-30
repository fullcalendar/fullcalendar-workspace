import { createPlugin, ViewSpec } from '@fullcalendar/core'
import ResourceCommonPlugin, { isVResourceViewEnabled } from '@fullcalendar/resource-common'
import TimeGridPlugin, { TimeGridView } from '@fullcalendar/timegrid'
import ResourceTimeGridView from './ResourceTimeGridView'


function transformTimeGridViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === TimeGridView && isVResourceViewEnabled(viewSpec)) {
    return {
      ...viewSpec,
      class: ResourceTimeGridView
    }
  }

  return viewSpec
}


export { ResourceTimeGridView }

export default createPlugin({
  deps: [ ResourceCommonPlugin, TimeGridPlugin ],
  viewSpecTransformers: [ transformTimeGridViewSpec ]
})
