import { createPlugin, ViewSpec } from '@fullcalendar/core'
import TimelinePlugin, { TimelineView } from '@fullcalendar/timeline'
import ResourceCommonPlugin from '@fullcalendar/resource-common'
import ResourceTimelineView from './ResourceTimelineView'

const RESOURCE_TIMELINE_DEFAULTS = {
  resourceAreaWidth: '30%',
  resourcesInitiallyExpanded: true,
  eventResizableFromStart: true // how is this consumed for TimelineView tho?
}

function transformViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === TimelineView && viewSpec.options.resources) {
    return {
      ...viewSpec,
      class: ResourceTimelineView,
      options: { ...RESOURCE_TIMELINE_DEFAULTS, ...viewSpec.options }
    }
  }

  return viewSpec
}

export { ResourceTimelineView }

export default createPlugin({
  deps: [ ResourceCommonPlugin, TimelinePlugin ],
  viewSpecTransformers: [ transformViewSpec ]
})
