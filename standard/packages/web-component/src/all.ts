import { plugins } from '@fullcalendar/vanilla/all'
import { FullCalendarElement as BareFullCalendarElement } from './FullCalendarElement'

export class FullCalendarElement extends BareFullCalendarElement {
  constructor() {
    super()
    this._forcedPlugins = plugins
  }
}

export { FullCalendarElement as default, plugins }
