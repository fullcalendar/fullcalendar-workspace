import { createPlugin, ViewSpec } from 'fullcalendar'
import TimelineView from './timeline/TimelineView'
import ResourceTimelineView from './resource-timeline/ResourceTimelineView'

let viewConfigs = {

  timeline: {
    class: TimelineView,
    eventResizableFromStart: true // how is this consumed for TimelineView tho?
  },

  timelineDay: {
    type: 'timeline',
    duration: { days: 1 }
  },

  timelineWeek: {
    type: 'timeline',
    duration: { weeks: 1 }
  },

  timelineMonth: {
    type: 'timeline',
    duration: { months: 1 }
  },

  timelineYear: {
    type: 'timeline',
    duration: { years: 1 }
  }

}

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

export { TimelineView, ResourceTimelineView }

export default createPlugin({
  viewConfigs,
  viewSpecTransformers: [ transformViewSpec ]
})
