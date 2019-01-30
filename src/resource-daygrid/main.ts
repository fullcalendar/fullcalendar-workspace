import { createPlugin, ViewSpec } from '@fullcalendar/core'
import ResourceCommonPlugin, { isVResourceViewEnabled } from '@fullcalendar/resource-common'
import DayGridPlugin, { DayGridView } from '@fullcalendar/daygrid'
import ResourceDayGridView from './ResourceDayGridView'

function transformDayGridViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === DayGridView && isVResourceViewEnabled(viewSpec)) {
    return {
      ...viewSpec,
      class: ResourceDayGridView
    }
  }

  return viewSpec
}


export { ResourceDayGridView }
export { default as ResourceDayGrid } from './ResourceDayGrid'

export default createPlugin({
  deps: [ ResourceCommonPlugin, DayGridPlugin ],
  viewSpecTransformers: [ transformDayGridViewSpec ]
})
