
export { Calendar } from './Calendar.js'

export { CalendarApi } from './api/CalendarApi.js'
export { CalendarController } from './CalendarController.js'
export { ViewApi } from './api/ViewApi.js'
export { EventSourceApi } from './api/EventSourceApi.js'
export { EventApi } from './api/EventApi.js'
export * from './api/structs.js'

export { FormatDateOptions, FormatRangeOptions } from './formatting-api.js'
export { formatDate, formatRange } from './formatting-api.js'
export { createPlugin } from './plugin-system.js'
export { sliceEvents } from './component-util/View.js'
export { EventRenderRange } from './component-util/event-rendering.js' // for sliceEvents
export { JsonRequestError } from './util/requestJson.js'

export { globalLocales } from './global-locales.js'
export { globalPlugins } from './global-plugins.js'

export const version: string = '<%= pkgVersion %>'
