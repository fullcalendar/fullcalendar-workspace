import { plugins } from '@fullcalendar/vanilla-scheduler/all'
import { FullCalendarElement as StandardFullCalendarElement } from '@fullcalendar/web-component/all'

export class FullCalendarElement extends StandardFullCalendarElement {
  constructor() {
    super()
    this._forcedPlugins!.push(...plugins)
  }
}

export { FullCalendarElement as default, plugins }
