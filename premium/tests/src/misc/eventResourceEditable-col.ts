import { parseUtcDate } from 'fullcalendar-tests/src/lib/date-parsing'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('eventResourceEditable in vertical resource view', () => {
  it('allows resource dragging while start-date-dragging is disabled', (done) => {
    let dropSpy
    let calendar = initCalendar({
      initialView: 'resourceTimeGridDay',
      now: '2019-08-01',
      scrollTime: '00:00',
      editable: true,
      eventStartEditable: false,
      eventResourceEditable: true,
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
      ],
      events: [
        { start: '2019-08-01T01:00:00', resourceId: 'a' },
      ],
      eventDrop: (dropSpy = spyCall((arg) => {
        expect(arg.event.start).toEqualDate(parseUtcDate('2019-08-01T01:00:00'))
        expect(arg.event.end).toEqual(null)

        let resources = arg.event.getResources()
        expect(resources.length).toBe(1)
        expect(resources[0].id).toBe('b')
      })),
    })
    let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

    $(resourceTimeGridWrapper.getFirstEventEl()).simulate('drag', {
      localPoint: {
        top: 1, // fudge for IE10 :(
        left: '50%',
      },
      end: resourceTimeGridWrapper.getPoint('b', '2019-08-01T05:00:00'),
      callback() {
        expect(dropSpy).toHaveBeenCalled()
        done()
      },
    })
  })
})
