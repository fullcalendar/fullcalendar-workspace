import { createPlugin, ViewSpec, BasicView, assignTo } from 'fullcalendar'
import ResourceBasicView from './ResourceBasicView'
import { isVResourceViewEnabled } from '../common/resource-day-table'

function transformViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === BasicView && isVResourceViewEnabled(viewSpec)) {
    return assignTo({}, viewSpec, {
      class: ResourceBasicView
    })
  }

  return viewSpec
}

export default createPlugin({
  viewSpecTransformers: [ transformViewSpec ]
})
