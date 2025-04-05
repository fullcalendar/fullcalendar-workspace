import { createPlugin, PluginDef } from '@fullcalendar/core'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: ['fc', 'fc-theme-standard'],
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
    popoverClassNames: 'fc-popover',
    popoverHeaderClassNames: 'fc-popover-header',
    popoverBodyClassNames: 'fc-popover-body',
  },
}) as PluginDef
