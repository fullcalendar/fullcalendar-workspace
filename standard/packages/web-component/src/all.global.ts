import * as PublicApi from '@fullcalendar/vanilla/public-api'
import * as ProtectedApi from '@fullcalendar/vanilla/protected-api'
import * as ProtectedStyles from '@fullcalendar/vanilla/protected-styles'
import { FullCalendarElement } from './all'
import './global-types'

// this is an IIFE file

globalThis.FullCalendarElement = FullCalendarElement
customElements.define('full-calendar', FullCalendarElement)

export * from '@fullcalendar/vanilla/public-api'
export { FullCalendarElement, PublicApi, ProtectedApi, ProtectedStyles }
