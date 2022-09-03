import { createPlugin } from '@fullcalendar/common'
import { buildLicenseWarning } from './license'
import { OPTION_REFINERS } from './options'
import './options-declare'

export default createPlugin({
  optionRefiners: OPTION_REFINERS,
  viewContainerAppends: [buildLicenseWarning],
})
