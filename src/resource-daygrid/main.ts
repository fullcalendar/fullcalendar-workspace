import { createPlugin, ViewSpec } from '@fullcalendar/core'
import ResourceCommonPlugin, { isVResourceViewEnabled } from '@fullcalendar/resource-common'
import DayGridPlugin, { BasicView } from '@fullcalendar/daygrid'
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
export { default as ResourceDayGrid } from './ResourceDayGrid'

export default createPlugin({
  deps: [ ResourceCommonPlugin, DayGridPlugin ],
  viewSpecTransformers: [ transformBasicViewSpec ]
})
