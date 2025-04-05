import { createPlugin, PluginDef } from '@fullcalendar/core'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: ['fc', 'fc-standard-theme'],
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
  },
}) as PluginDef
