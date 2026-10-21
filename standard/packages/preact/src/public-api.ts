
export { CalendarApi } from './api/CalendarApi'
export { CalendarController } from './calendar/CalendarController'
export { ViewApi } from './api/ViewApi'
export { EventSourceApi } from './api/EventSourceApi'
export { EventApi } from './api/EventApi'
export * from './api/public-types'

export { FormatDateOptions, FormatRangeOptions } from './datelib/format-api'
export { formatDate, formatRange } from './datelib/format-api'
export { sliceEvents } from './views/view-props'
export { EventRenderRange } from './event-segs/event-rendering' // for sliceEvents
export { JsonRequestError } from './util/requestJson'
export { joinClassNames } from './util/html'

export { globalLocales } from './datelib/global-locales'
export { globalPlugins } from './plugins/global-plugins'

export const version: string = '<%= pkgVersion %>'
