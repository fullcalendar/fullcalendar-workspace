import { createPlugin, PluginDef } from '@fullcalendar/core'

export default createPlugin({
  name: 'theme-for-tests',
  optionDefaults: {
    className: 'fc',
    toolbarClass: 'fc-toolbar',
    headerToolbarClass: 'fc-header-toolbar',
    footerToolbarClass: 'fc-footer-toolbar',
    headerToolbar: {
      start: 'title',
      end: 'today prev,next',
    },
  },
}) as PluginDef
