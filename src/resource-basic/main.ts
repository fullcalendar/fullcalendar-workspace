import { createPlugin, ViewSpec } from 'fullcalendar'
import { isVResourceViewEnabled } from 'fullcalendar-resources'
import { BasicView } from 'fullcalendar-basic'
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
