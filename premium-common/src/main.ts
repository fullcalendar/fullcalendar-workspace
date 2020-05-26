import { createPlugin } from '@fullcalendar/common'
import { buildLicenseWarning } from './license'
import './options-declare'

export default createPlugin({
  viewContainerAppends: [ buildLicenseWarning ]
})
