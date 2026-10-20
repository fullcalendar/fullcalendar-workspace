/*
Event render hooks across changes to an event that re-render it differently. Found in the phase-4 review
(planning/phase-4-event-pilot.md)
*/
describe('event render hooks when the event changes', () => {
  pushOptions({
    initialView: 'dayGridMonth',
    initialDate: '2014-08-01',
  })

  it('does not remount when switching between list-item and block display', () => {
    let didMountCnt = 0
    let willUnmountCnt = 0
    let calendar = initCalendar({
      events: [{ id: '1', title: 'event1', start: '2014-08-02T10:00:00' }], // list-item by default
      eventDidMount() {
        didMountCnt += 1
      },
      eventWillUnmount() {
        willUnmountCnt += 1
      },
    })

    calendar.getEventById('1').setProp('display', 'block')
    calendar.getEventById('1').setProp('display', 'list-item')

    expect(didMountCnt).toBe(1)
    expect(willUnmountCnt).toBe(0)
  })

  it('passes the current element to eventWillUnmount after the tag changes', () => {
    let unmountedEl: HTMLElement | undefined
    let calendar = initCalendar({
      events: [{ id: '1', title: 'event1', start: '2014-08-02' }],
      eventWillUnmount(info) {
        unmountedEl = info.el
      },
    })
    let event = calendar.getEventById('1')

    event.setProp('url', 'http://example.com/') // the root becomes an <a>
    event.remove()

    expect(unmountedEl.tagName).toBe('A')
  })

  // the Vue/Angular connectors register content on isActive:true, and rely on isActive:false to release it
  it('deactivates custom rendering enabled after mount, with the options of the time', () => {
    let activeIds = new Set<string>()
    let calendar = initCalendar({
      events: [{ id: '1', title: 'event1', start: '2014-08-02' }],
      handleCustomRendering(info) {
        if (info.isActive) {
          activeIds.add(info.id)
        } else {
          activeIds.delete(info.id)
        }
      },
    })

    calendar.setOption('customRenderingMetaMap', { eventContent: {} })
    expect(activeIds.size).toBe(1) // sanity check

    calendar.getEventById('1').remove()
    expect(activeIds.size).toBe(0)
  })
})
