import dayGridPlugin from 'fullcalendar/daygrid'

/*
The resource plugin registers its actions (the calendarActions hook), which the CalendarApi patches and
ResourceApi run (planning/phase-9-store.md)
*/
describe('resource actions', () => {
  pushOptions({
    initialView: 'resourceTimelineDay',
    initialDate: '2024-01-10',
  })

  it('are in store.actions, and are what the API and ResourceApi run', () => {
    let calendar = initCalendar({
      resources: [{ id: 'a', title: 'A' }],
    })
    let actions = calendar.store.actions as any
    let names = ['addResource', 'refetchResources', 'setResourceProp', 'setResourceExtendedProp', 'removeResource']

    for (let name of names) {
      spyOn(actions, name).and.callThrough()
    }

    calendar.addResource({ id: 'b', title: 'B' })
    calendar.refetchResources()
    let resource = calendar.getResourceById('a')
    resource.setProp('title', 'A2')
    resource.setExtendedProp('x', 1)
    resource.remove()

    for (let name of names) {
      expect(actions[name]).toHaveBeenCalledTimes(1)
    }
  })

  it('change a resource as ResourceApi did: the wrapper updates, and resourceChange can revert', () => {
    let changeArgs = []
    let calendar = initCalendar({
      resources: [{ id: 'a', title: 'A' }],
      resourceChange(arg) {
        changeArgs.push(arg)
      },
    })
    let resource = calendar.getResourceById('a')

    resource.setProp('title', 'A2')
    expect(resource.title).toBe('A2')
    expect(calendar.getResourceById('a').title).toBe('A2')
    expect(changeArgs.length).toBe(1)
    expect(changeArgs[0].oldResource.title).toBe('A')
    expect(changeArgs[0].resource).toBe(resource)

    changeArgs[0].revert()
    expect(calendar.getResourceById('a').title).toBe('A')
  })

  // the patches exist whenever the scheduler bundle is imported, and have always run without the plugin
  it('still run for a calendar without the resource plugin', () => {
    let calendar = initCalendar({
      plugins: [dayGridPlugin],
      initialView: 'dayGridMonth',
    })

    expect((calendar.store.actions as any).addResource).toBeUndefined()
    let resource = calendar.addResource({ id: 'b', title: 'B' })
    expect(resource.id).toBe('b')
    expect(() => calendar.refetchResources()).not.toThrow()
  })
})
