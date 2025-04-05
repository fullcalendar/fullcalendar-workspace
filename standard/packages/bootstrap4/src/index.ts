import { createPlugin, PluginDef } from '@fullcalendar/core'
import { BootstrapTheme } from './BootstrapTheme.js'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
  themeClasses: {
    bootstrap: BootstrapTheme,
  },
  optionDefaults: {
    classNames: ['fc', 'fc-theme-bootstrap'],
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
  },
}) as PluginDef
