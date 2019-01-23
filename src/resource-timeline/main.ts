import { createPlugin, ViewSpec } from 'fullcalendar'
import { TimelineView } from 'fullcalendar-timeline'
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
  viewSpecTransformers: [ transformViewSpec ]
})
