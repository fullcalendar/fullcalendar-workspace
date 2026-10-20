import { describe, expect, it, vi } from 'vitest'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { createHeldFetch } from '../lib/fetching'
import { getTimelineResourceIds, getTimelineResourceTitles, ResourceColumnsModel } from '../lib/models/resource-columns'

/*
Querying, adding, changing and removing resources, through the Calendar and ResourceApi methods,
and the callbacks that report the changes.
*/
describe('resource CRUD', () => {
  const options = {
    initialView: 'resourceTimelineDay',
    initialDate: '2015-11-17',
  }
  const treeResources = [
    { id: 'a', title: 'room a' },
    { id: 'b', title: 'room b', children: [{ id: 'b1', title: 'room b1' }] },
  ]

  function getTitles(resources: { title: string }[]): string[] {
    return resources.map((resource) => resource.title)
  }

  describe('getResourceById', () => {
    it.each([
      ['an alphabetical id', 'a', 'a'],
      ['a numeric id, as a string', '1', '1'],
      ['a numeric id, as a number', '1', 1],
    ])('finds a resource by %s', (_desc, id, query) => {
      const calendar = initCalendar({ ...options, resources: [{ id, title: 'the room' }] })

      expect(calendar.getResourceById(query as string)!.title).toBe('the room')
    })

    it('returns null for an unknown id', () => {
      const calendar = initCalendar({ ...options, resources: [{ id: 'a', title: 'room a' }] })

      expect(calendar.getResourceById('a')).not.toBeNull()
      expect(calendar.getResourceById('z')).toBeNull()
    })
  })

  describe('querying the tree', () => {
    it('getResources returns every resource, nested ones included', () => {
      const calendar = initCalendar({ ...options, resources: treeResources })

      expect(getTitles(calendar.getResources())).toEqual(['room a', 'room b', 'room b1'])
    })

    it('getTopLevelResources returns only top-level resources', () => {
      const calendar = initCalendar({ ...options, resources: treeResources })

      expect(getTitles(calendar.getTopLevelResources())).toEqual(['room a', 'room b'])
    })

    it('getChildren and getParent walk the tree', () => {
      const calendar = initCalendar({ ...options, resources: treeResources })

      expect(getTitles(calendar.getResourceById('b')!.getChildren())).toEqual(['room b1'])
      expect(calendar.getResourceById('a')!.getChildren()).toEqual([])
      expect(calendar.getResourceById('b1')!.getParent()!.title).toBe('room b')
      expect(calendar.getResourceById('b')!.getParent()).toBeNull()
    })

    it('getResources returns a snapshot that later changes don\'t mutate', () => {
      const calendar = initCalendar({
        ...options,
        resources: [
          { id: 'a', title: 'a' },
          { id: 'b', title: 'b' },
          { id: 'c', title: 'c' },
        ],
      })
      const resources = calendar.getResources()

      resources[0].remove()

      expect(resources).toHaveLength(3)
      expect(getTitles(calendar.getResources())).toEqual(['b', 'c'])
    })
  })

  describe('ResourceApi::getEvents', () => {
    it.each([
      ['resourceId', { resourceId: 'a' }],
      ['resourceIds', { resourceIds: ['a', 'b'] }],
    ])('returns the events associated by %s', (_desc, resourceProps) => {
      const calendar = initCalendar({
        ...options,
        resources: [
          { id: 'a', title: 'room a' },
          { id: 'b', title: 'room b' },
          { id: 'c', title: 'room c' },
        ],
        events: [
          { id: '1', start: '2015-11-17', end: '2015-11-18', ...resourceProps },
          { id: '2', start: '2015-11-17', end: '2015-11-18', resourceId: 'c' },
        ],
      })

      expect(calendar.getResourceById('a')!.getEvents().map((event) => event.id)).toEqual(['1'])
    })
  })

  describe('rendering changes', () => {
    function getRenderedIdsIn(view: string, calendar: Calendar): string[] {
      return view === 'resourceTimelineDay'
        ? getTimelineResourceIds(calendar.el)
        : new ResourceColumnsModel(calendar.el).getResourceHeaderIds()
    }

    /*
    The resources of the body: the timeline's lanes, or the columns' day lanes/day cells.
    */
    function getRenderedBodyIdsIn(view: string, calendar: Calendar): (string | null)[] {
      if (view === 'resourceTimelineDay') {
        return getTimelineResourceIds(calendar.el)
      }
      const columns = new ResourceColumnsModel(calendar.el)
      const columnInfos = view === 'resourceTimeGridDay' ? columns.getDayLaneColumns() : columns.getDayCellColumns()
      return columnInfos.map((column) => column.resourceId)
    }

    describe.each(['resourceTimelineDay', 'resourceTimeGridDay', 'resourceDayGridDay'])('in %s', (initialView) => {
      const viewOptions = {
        ...options,
        initialView,
        resources: [
          { id: 'a', title: 'Auditorium A' },
          { id: 'b', title: 'Auditorium B' },
          { id: 'c', title: 'Auditorium C' },
        ],
      }

      it('adds a resource with addResource', async () => {
        const calendar = initCalendar(viewOptions)
        await waitForSettle()
        expect(getRenderedIdsIn(initialView, calendar)).toEqual(['a', 'b', 'c'])

        const resource = calendar.addResource({ id: 'd', title: 'Auditorium D' })
        await waitForSettle()

        expect(resource.title).toBe('Auditorium D')
        expect(getTitles(calendar.getResources())).toEqual(['Auditorium A', 'Auditorium B', 'Auditorium C', 'Auditorium D'])
        expect(getRenderedIdsIn(initialView, calendar)).toEqual(['a', 'b', 'c', 'd'])
      })

      it('removes resources with ResourceApi::remove, even in quick succession', async () => {
        const calendar = initCalendar(viewOptions)
        await waitForSettle()

        expect(getRenderedBodyIdsIn(initialView, calendar)).toEqual(['a', 'b', 'c'])

        calendar.getResourceById('a')!.remove()
        expect(getRenderedIdsIn(initialView, calendar)).toEqual(['b', 'c'])
        expect(getRenderedBodyIdsIn(initialView, calendar)).toEqual(['b', 'c'])

        calendar.getResourceById('b')!.remove()
        expect(getRenderedIdsIn(initialView, calendar)).toEqual(['c'])
        expect(getRenderedBodyIdsIn(initialView, calendar)).toEqual(['c'])

        calendar.getResourceById('c')!.remove()
        await waitForSettle()
        expect(getRenderedIdsIn(initialView, calendar)).toEqual([])
        // without resources, a column view falls back to one resource-less column for the day
        expect(getRenderedBodyIdsIn(initialView, calendar)).toEqual(initialView === 'resourceTimelineDay' ? [] : [null])
        expect(calendar.getResources()).toEqual([])
      })
    })

    it('replaces the resources with refetchResources', async () => {
      const heldResources = createHeldFetch((callNum) => (
        callNum === 1
          ? [{ id: 'a', title: 'room a' }, { id: 'b', title: 'room b' }]
          : [{ id: 'c', title: 'room c' }]
      ))
      const calendar = initCalendar({ ...options, resources: heldResources.fetch })
      await heldResources.release(1)
      expect(getTimelineResourceTitles(calendar.el)).toEqual(['room a', 'room b'])

      calendar.refetchResources()
      await heldResources.release(2)

      expect(getTitles(calendar.getResources())).toEqual(['room c'])
      expect(getTimelineResourceTitles(calendar.el)).toEqual(['room c'])
    })

    it('rerenders changed titles after refetchResources in resource timeGrid', async () => {
      const heldResources = createHeldFetch((callNum) => [
        { id: 'a', title: `Auditorium A${callNum}` },
        { id: 'b', title: 'Auditorium B' },
      ])
      const calendar = initCalendar({ ...options, initialView: 'resourceTimeGridDay', resources: heldResources.fetch })
      await heldResources.release(1)
      const columns = new ResourceColumnsModel(calendar.el)
      expect(columns.getResourceHeaderTitles()).toEqual(['Auditorium A1', 'Auditorium B'])

      calendar.refetchResources()
      await heldResources.release(2)

      expect(columns.getResourceHeaderTitles()).toEqual(['Auditorium A2', 'Auditorium B'])
    })
  })

  describe('ResourceApi::setProp and setExtendedProp', () => {
    it('changes the title and rerenders it', async () => {
      const calendar = initCalendar({ ...options, resources: [{ id: 'a', title: 'room a' }] })
      await waitForSettle()
      const resource = calendar.getResourceById('a')!

      resource.setProp('title', 'room z')
      await waitForSettle()

      expect(resource.title).toBe('room z')
      expect(calendar.getResourceById('a')!.title).toBe('room z')
      expect(getTimelineResourceTitles(calendar.el)).toEqual(['room z'])
    })

    // KNOWN BUG (`it.fails` until fixed): setProp writes the raw prop name onto the internal resource, but event-styling props
    // live in its `ui` (eventColor -> ui.color), so the change is lost. See planning/agent-notes/scheduler-misc.md
    it.fails('changes an event-styling prop', () => {
      const calendar = initCalendar({ ...options, resources: [{ id: 'a', title: 'room a', eventColor: 'red' }] })
      const resource = calendar.getResourceById('a')!

      resource.setProp('eventColor', 'blue')

      expect(resource.eventColor).toBe('blue')
    })

    it('changes an extended prop', () => {
      const calendar = initCalendar({ ...options, resources: [{ id: 'a', title: 'room a', floor: 1, wing: 'east' }] })
      const resource = calendar.getResourceById('a')!

      resource.setExtendedProp('floor', 2)

      expect(resource.extendedProps).toEqual({ floor: 2, wing: 'east' })
      expect(calendar.getResourceById('a')!.extendedProps).toEqual({ floor: 2, wing: 'east' })
    })
  })

  describe('change callbacks', () => {
    it('resourceAdd reports the added resource and can revert', async () => {
      const resourceAdd = vi.fn()
      const calendar = initCalendar({ ...options, resources: [{ id: 'a', title: 'room a' }], resourceAdd })

      calendar.addResource({ id: 'b', title: 'room b' })

      expect(resourceAdd).toHaveBeenCalledTimes(1)
      const info = resourceAdd.mock.calls[0][0]
      expect(info.resource.id).toBe('b')

      info.revert()
      await waitForSettle()
      expect(calendar.getResources().map((resource) => resource.id)).toEqual(['a'])
      expect(getTimelineResourceIds(calendar.el)).toEqual(['a'])
    })

    it('resourceChange reports the old and new resource and can revert', async () => {
      const resourceChange = vi.fn()
      const calendar = initCalendar({ ...options, resources: [{ id: 'a', title: 'room a' }], resourceChange })

      calendar.getResourceById('a')!.setProp('title', 'room z')

      expect(resourceChange).toHaveBeenCalledTimes(1)
      const info = resourceChange.mock.calls[0][0]
      expect(info.oldResource.title).toBe('room a')
      expect(info.resource.title).toBe('room z')

      info.revert()
      await waitForSettle()
      expect(calendar.getResourceById('a')!.title).toBe('room a')
      expect(getTimelineResourceTitles(calendar.el)).toEqual(['room a'])
    })

    it('resourceRemove reports the removed resource and can revert', async () => {
      const resourceRemove = vi.fn()
      const calendar = initCalendar({
        ...options,
        resources: [{ id: 'a', title: 'room a' }, { id: 'b', title: 'room b' }],
        resourceRemove,
      })

      calendar.getResourceById('a')!.remove()

      expect(resourceRemove).toHaveBeenCalledTimes(1)
      const info = resourceRemove.mock.calls[0][0]
      expect(info.resource.id).toBe('a')
      expect(calendar.getResources().map((resource) => resource.id)).toEqual(['b'])

      info.revert()
      await waitForSettle()
      expect(calendar.getResources().map((resource) => resource.id).sort()).toEqual(['a', 'b'])
      expect(getTimelineResourceIds(calendar.el)).toEqual(['a', 'b'])
    })

    it('resourcesSet reports the full set after each change', () => {
      const resourcesSet = vi.fn()
      const calendar = initCalendar({ ...options, resources: [{ id: 'a', title: 'room a' }], resourcesSet })

      expect(resourcesSet).toHaveBeenCalled()
      const getLastIds = () => resourcesSet.mock.lastCall![0].map((resource: { id: string }) => resource.id)
      expect(getLastIds()).toEqual(['a'])

      calendar.addResource({ id: 'b', title: 'room b' })
      expect(getLastIds()).toEqual(['a', 'b'])

      calendar.getResourceById('a')!.remove()
      expect(getLastIds()).toEqual(['b'])
    })
  })

  describe('ResourceApi::toPlainObject', () => {
    it('includes the id, title, eventClass, eventContrastColor and extendedProps', () => {
      const calendar = initCalendar({
        ...options,
        resources: [{
          id: 'a',
          title: 'room a',
          eventClass: 'nice',
          eventContrastColor: 'green',
          floor: 2,
        }],
      })
      const resource = calendar.getResourceById('a')!

      expect(resource.toPlainObject()).toEqual({
        id: 'a',
        title: 'room a',
        eventClass: 'nice',
        eventContrastColor: 'green',
        extendedProps: { floor: 2 },
      })
      expect(resource.toPlainObject({ collapseExtendedProps: true })).toEqual({
        id: 'a',
        title: 'room a',
        eventClass: 'nice',
        eventContrastColor: 'green',
        floor: 2,
      })
    })

    // KNOWN BUG (`it.fails` until fixed): toPlainObject writes eventContrastColor twice and never writes eventColor
    // (premium/packages/preact-scheduler/src/resource/api/ResourceApi.ts). See planning/agent-notes/scheduler-misc.md
    it.fails('includes eventColor', () => {
      const calendar = initCalendar({ ...options, resources: [{ id: 'a', eventColor: 'red' }] })

      expect(calendar.getResourceById('a')!.toPlainObject()).toEqual({ id: 'a', eventColor: 'red' })
    })
  })
})
