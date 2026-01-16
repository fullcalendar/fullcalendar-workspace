
import * as JSXRuntime from 'react/jsx-runtime'
import * as FullCalendarPreact from '@fullcalendar/preact'

// for side-effects
import '@fullcalendar/preact/all'

// export whole namespace
export * from './index'

// export transitive deps
export { FullCalendarPreact as Preact, JSXRuntime }
