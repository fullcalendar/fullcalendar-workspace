import { BASE_OPTION_REFINERS, BASE_OPTION_DEFAULTS } from '@fullcalendar/core'

// so that Calendars that don't use resource-common won't throw warning about unknown option
BASE_OPTION_REFINERS.schedulerLicenseKey = String

BASE_OPTION_DEFAULTS.schedulerLicenseKey = 'GPL-My-Project-Is-Open-Source'
