import { createPlugin, PluginDef } from '@fullcalendar/preact'
import { buildLicenseWarning } from './license'
import { OPTION_REFINERS } from './options'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  optionRefiners: OPTION_REFINERS,
  viewContainerAppends: [buildLicenseWarning],
}) as PluginDef
