import * as Preact from 'preact'
import * as PreactJSXRuntime from 'preact/jsx-runtime'
import * as ProtectedApi from '@fullcalendar/vanilla/protected-api'
import * as ProtectedStyles from '@fullcalendar/vanilla/protected-styles'
import * as Interaction from '@fullcalendar/vanilla/interaction'
import * as DayGrid from '@fullcalendar/vanilla/daygrid'
import * as TimeGrid from '@fullcalendar/vanilla/timegrid'
import * as List from '@fullcalendar/vanilla/list'
import * as MultiMonth from '@fullcalendar/vanilla/multimonth'
import { FullCalendarElement } from './all'
import './global-types'

// this is an IIFE file

globalThis.FullCalendarElement = FullCalendarElement
customElements.define('full-calendar', FullCalendarElement)

export * from '@fullcalendar/vanilla/public-api'
export {
  Preact,
  PreactJSXRuntime,
  FullCalendarElement,
  ProtectedApi,
  ProtectedStyles,
  Interaction,
  DayGrid,
  TimeGrid,
  List,
  MultiMonth,
}
