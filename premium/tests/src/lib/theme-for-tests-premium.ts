import { createPlugin, PluginDef } from '@fullcalendar/core'

export default createPlugin({
  name: 'theme-for-tests-premium',
  optionDefaults: {
    resourceExpanderClass: (data) => [
      'fc-resource-expander',
      data.isExpanded ? 'fc-resource-expander-expanded' : 'fc-resource-expander-collapsed',
    ],
    resourceIndentClass: 'fc-resource-indent',
  },
  views: {
  }
}) as PluginDef
