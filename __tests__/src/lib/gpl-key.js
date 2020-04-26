import { globalDefaults } from '@fullcalendar/core'

// HACK to get to compile
/** @type {any} */
let tmp = globalDefaults

tmp.schedulerLicenseKey = 'GPL-My-Project-Is-Open-Source'
