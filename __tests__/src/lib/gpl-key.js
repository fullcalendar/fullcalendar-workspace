import { globalDefaults } from '@fullcalendar/preact'

// HACK to get to compile
/** @type {any} */
let tmp = globalDefaults

tmp.schedulerLicenseKey = 'GPL-My-Project-Is-Open-Source'
