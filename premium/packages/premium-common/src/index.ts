import { createPlugin } from '@fullcalendar/core'
import { buildLicenseWarning } from './license.js'
import { OPTION_REFINERS } from './options.js'
import './options-declare.js'

export default createPlugin({
  optionRefiners: OPTION_REFINERS,
  viewContainerAppends: [buildLicenseWarning],
})
