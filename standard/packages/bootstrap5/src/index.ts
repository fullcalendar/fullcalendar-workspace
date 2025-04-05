import { createPlugin, PluginDef } from '@fullcalendar/core'
import { BootstrapTheme } from './BootstrapTheme.js'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
  themeClasses: {
    bootstrap5: BootstrapTheme,
  },
  optionDefaults: {
    classNames: ['fc', 'fc-theme-bootstrap5'],
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
    popoverClassNames: ['fc-popover', 'popover'],
    popoverHeaderClassNames: ['fc-popover-header', 'popover-header'],
    popoverBodyClassNames: ['fc-popover-body', 'popover-body'],
  }
}) as PluginDef
