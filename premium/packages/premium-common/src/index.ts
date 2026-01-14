import { createPlugin, PluginDef } from '@fullcalendar/core'
import { buildLicenseWarning } from './license'
import { OPTION_REFINERS } from './options'
import './ambient'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  optionRefiners: OPTION_REFINERS,
  viewContainerAppends: [buildLicenseWarning],
}) as PluginDef

export { PremiumOptions } from './options'
