import { Calendar } from '@fullcalendar/core'
import InteractionPlugin from '@fullcalendar/interaction'
import ResourceTimelinePlugin from '@fullcalendar/resource-timeline'
import { getResourceTimelinePoint } from '../lib/timeline'

describe('timeline dragging events between calendars', function() {
  let DEFAULT_DATE = '2019-01-01'
  let el0, el1
  let calendar0, calendar1

  beforeEach(function() {
    el0 = document.createElement('div')
    el1 = document.createElement('div')

    el0.style.width = el1.style.width = '50%'
    el0.style.cssFloat = el1.style.cssFloat = 'left'

    document.body.appendChild(el0)
    document.body.appendChild(el1)
  })

  afterEach(function() {
    if (calendar0) {
      calendar0.destroy()
    }

    if (calendar1) {
      calendar1.destroy()
    }

    document.body.removeChild(el0)
    document.body.removeChild(el1)
  })

  it('works when calendars have different resources', function(done) {

    // calendar we drag the event TO
    // important to have this first in the DOM so that dragElTo works
    calendar0 = new Calendar(el0, {
      plugins: [ ResourceTimelinePlugin, InteractionPlugin ],
      timeZone: 'UTC',
      scrollTime: '00:00',
      defaultDate: DEFAULT_DATE,
      defaultView: 'resourceTimelineDay',
      editable: true,
      droppable: true,
      resources: [
        { id: 'b' }
      ],
      eventReceive(info) {
        expect(info.event.start).toEqualDate(DEFAULT_DATE + 'T00:00:00Z')
        done()
      }
    })

    // calendar we drag the event FROM
    calendar1 = new Calendar(el1, {
      plugins: [ ResourceTimelinePlugin, InteractionPlugin ],
      timeZone: 'UTC',
      scrollTime: '00:00',
      defaultDate: DEFAULT_DATE,
      defaultView: 'resourceTimelineDay',
      editable: true,
      resources: [
        { id: 'a' }
      ],
      events: [
        { resourceId: 'a', start: DEFAULT_DATE, allDay: false }
      ]
    })

    calendar0.render()
    calendar1.render()

    dragElTo($('.fc-event'), 'b', DEFAULT_DATE + 'T00:00:00')
  })


  // copy and pasted from other DND file :(
  function dragElTo(el, resourceId, date, callback, onBeforeRelease) {
    el.simulate('drag', {
      localPoint: { left: 0, top: '50%' },
      end: getResourceTimelinePoint(resourceId, date),
      onBeforeRelease,
      callback
    })
  }

})
