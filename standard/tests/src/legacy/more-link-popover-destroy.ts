import { DayGridViewWrapper } from '../lib/wrappers/DayGridViewWrapper.js'

describe('more-link popover', () => {
  pushOptions({
    initialView: 'dayGridMonth',
    initialDate: '2014-08-01',
    dayMaxEventRows: 3,
    events: [
      { title: 'event1', start: '2014-07-28', end: '2014-07-30', className: 'event1' },
      { title: 'event2', start: '2014-07-29', end: '2014-07-31', className: 'event2' },
      { title: 'event3', start: '2014-07-29', className: 'event3' },
      { title: 'event4', start: '2014-07-29', className: 'event4' },
    ],
  })

  it('closes when user clicks the X and trigger eventWillUnmount for every render', (done) => {
    let eventsRendered = {}
    let renderCount = 0
    let activated = false

    let calendar = initCalendar({
      eventDidMount(data) {
        if (activated) {
          eventsRendered[data.event.title] = true
          renderCount += 1
        }
      },
      eventWillUnmount(data) {
        delete eventsRendered[data.event.title]
        renderCount -= 1
      },
    })
    let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid

    // Activate flags and pop event limit popover
    activated = true
    dayGridWrapper.openMorePopover()
    setTimeout(() => {
      expect(dayGridWrapper.getMorePopoverEl()).toBeVisible()

      dayGridWrapper.closeMorePopover()
      setTimeout(() => {
        expect(dayGridWrapper.getMorePopoverEl()).not.toBeVisible()
        expect(Object.keys(eventsRendered).length).toEqual(0)
        expect(renderCount).toEqual(0)
        done()
      })
    })
  })

  it('closes when user clicks outside of the popover and trigger eventWillUnmount for every render', (done) => {
    let eventsRendered = {}
    let renderCount = 0
    let activated = false

    let calendar = initCalendar({
      eventDidMount(data) {
        if (activated) {
          eventsRendered[data.event.title] = true
          renderCount += 1
        }
      },
      eventWillUnmount(data) {
        delete eventsRendered[data.event.title]
        renderCount -= 1
      },
    })
    let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid

    // Activate flags and pop event limit popover
    activated = true
    dayGridWrapper.openMorePopover()
    setTimeout(() => {
      expect(dayGridWrapper.getMorePopoverEl()).toBeVisible()

      $('body').simulate('mousedown').simulate('click')
      setTimeout(() => {
        expect(dayGridWrapper.getMorePopoverEl()).not.toBeVisible()
        expect(Object.keys(eventsRendered).length).toEqual(0)
        expect(renderCount).toEqual(0)
        done()
      })
    })
  })
})
