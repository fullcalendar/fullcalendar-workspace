import { Calendar } from '@fullcalendar/core'
import ViewWrapper from 'standard-tests/src/lib/wrappers/ViewWrapper'
import ResourceTimeGridWrapper from './ResourceTimeGridWrapper'


export default class ResourceTimeGridViewWrapper extends ViewWrapper {

  constructor(calendar: Calendar) {
    super(calendar, 'fc-timeGrid-view')
  }

  get timeGrid() {
    return new ResourceTimeGridWrapper(this.el.querySelector('.fc-time-grid'))
  }

}
