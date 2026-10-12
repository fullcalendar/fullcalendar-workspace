import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

// without roving tabindex, a flat resource timeline is a table (a grid makes JAWS switch to forms
// mode when focus lands on an event). with nesting, it stays a treegrid to convey the hierarchy
describe('resource timeline table roles', () => {
  pushOptions({
    initialView: 'resourceTimelineDay',
    initialDate: '2023-04-03',
    resourceColumns: [
      { field: 'title', headerContent: 'Room' },
      { field: 'occupancy', headerContent: 'Occupancy' },
    ],
  })

  it('renders a table with cells when resources are flat', async () => {
    let calendar = initCalendar({
      resources: [
        { id: 'a', title: 'Room A', occupancy: 40 },
        { id: 'b', title: 'Room B', occupancy: 60 },
      ],
    })
    await waitTimeout()
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    expect(calendar.el.querySelector('[role=table]')).toBeTruthy()
    expect(calendar.el.querySelector('[role=grid], [role=treegrid], [role=gridcell]')).toBe(null)
    expect(viewWrapper.timelineGrid.getResourceLaneEl('a').getAttribute('role')).toBe('cell')

    let resourceCellEls = viewWrapper.dataGrid.getResourceCellEls('a')
    expect(resourceCellEls[0].getAttribute('role')).toBe('rowheader')
    expect(resourceCellEls[1].getAttribute('role')).toBe('cell')
  })

  it('renders a treegrid with gridcells when resources are nested', async () => {
    let calendar = initCalendar({
      resources: [
        { id: 'a', title: 'Room A', occupancy: 40, children: [
          { id: 'a1', title: 'Room A1', occupancy: 10 },
        ] },
      ],
    })
    await waitTimeout()
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    expect(calendar.el.querySelector('[role=treegrid]')).toBeTruthy()
    expect(calendar.el.querySelector('[role=table], [role=cell]')).toBe(null)
    expect(viewWrapper.timelineGrid.getResourceLaneEl('a1').getAttribute('role')).toBe('gridcell')

    let resourceCellEls = viewWrapper.dataGrid.getResourceCellEls('a1')
    expect(resourceCellEls[0].getAttribute('role')).toBe('rowheader')
    expect(resourceCellEls[1].getAttribute('role')).toBe('gridcell')
  })

  it('renders a treegrid with gridcells when resources are grouped by row', async () => {
    let calendar = initCalendar({
      resourceGroupField: 'building',
      resources: [
        { id: 'a', title: 'Room A', occupancy: 40, building: 'East' },
        { id: 'b', title: 'Room B', occupancy: 60, building: 'West' },
      ],
    })
    await waitTimeout()
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    expect(calendar.el.querySelector('[role=treegrid]')).toBeTruthy()
    expect(calendar.el.querySelector('[role=table], [role=cell]')).toBe(null)
    expect(viewWrapper.timelineGrid.getResourceLaneEl('a').getAttribute('role')).toBe('gridcell')
  })
})
