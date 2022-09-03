import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('timeline resource grouping', () => {
  pushOptions({
    initialView: 'resourceTimeline',
    resourceGroupField: 'groupId',
    resources: [
      {
        id: 'A',
        groupId: '1',
        title: 'Resource A',
      },
      {
        id: 'B',
        groupId: '1',
        title: 'Resource B',
      },
      {
        id: 'C',
        groupId: '2',
        title: 'Resource C',
      },
    ],
  })

  it('renders the hierarchy correctly', () => {
    let calendar = initCalendar()
    let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid
    let rows = dataGridWrapper.getRowInfo()

    expect(rows.length).toBe(5)
    expect(rows[0].type).toBe('group')
    expect(rows[0].text).toBe('1')
    expect(rows[1].resourceId).toBe('A')
    expect(rows[2].resourceId).toBe('B')
    expect(rows[3].type).toBe('group')
    expect(rows[3].text).toBe('2')
    expect(rows[4].resourceId).toBe('C')
  })

  // https://github.com/fullcalendar/fullcalendar-scheduler/issues/490
  it('works with resourceOrder', () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resourceOrder: 'building',
      resourceGroupField: 'building',
      resourcesInitiallyExpanded: false,
      resourceAreaHeaderContent: 'Rooms',
      resources: [
        { id: 'a', title: 'Room A', building: 'Delta' },
        { id: 'b', title: 'Room B', building: 'Delta' },
        { id: 'c', title: 'Room C', building: 'Beta' },
        { id: 'd', title: 'Room D', building: 'Beta' },
        { id: 'e', title: 'Room E', building: 'Alpha' },
        { id: 'f', title: 'Room F', building: 'Gamma' },
        { id: 'g', title: 'Room G', building: 'Epsilon' },
        { id: 'h', title: 'Room H', building: 'Beta' },
        { id: 'i', title: 'Room I', building: 'Beta' },
        { id: 'j', title: 'Room J', building: 'Epsilon' },
        { id: 'k', title: 'Room K', building: 'Gamma' },
        { id: 'l', title: 'Room L', building: 'Gamma' },
        { id: 'm', title: 'Room M', building: 'Epsilon' },
        { id: 'n', title: 'Room N', building: 'Alpha' },
        { id: 'o', title: 'Room O', building: 'Epsilon' },
        { id: 'p', title: 'Room P', building: 'Epsilon' },
        { id: 'q', title: 'Room Q', building: 'Beta' },
        { id: 'r', title: 'Room R', building: 'Alpha' },
        { id: 's', title: 'Room S', building: 'Alpha' },
        { id: 't', title: 'Room T', building: 'Delta' },
        { id: 'u', title: 'Room U', building: 'Alpha' },
        { id: 'v', title: 'Room V', building: 'Alpha' },
        { id: 'w', title: 'Room W', building: 'Beta' },
        { id: 'x', title: 'Room X', building: 'Gamma' },
        { id: 'y', title: 'Room Y', building: 'Epsilon' },
        { id: 'z', title: 'Room Z', building: 'Epsilon' },
      ],
    })

    let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid
    let rows = dataGridWrapper.getRowInfo()

    let groupTexts = rows.map((row) => row.text)

    expect(groupTexts).toEqual([
      'Alpha', 'Beta', 'Delta', 'Epsilon', 'Gamma',
    ])
  })

  it('renders base off resourceGroupLabelContent function', () => {
    let calendar = initCalendar({
      resourceGroupLabelContent(arg) {
        return `Group ${arg.groupValue}`
      },
    })

    let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid
    let rows = dataGridWrapper.getRowInfo()

    expect(rows.length).toBe(5)
    expect(rows[0].type).toBe('group')
    expect(rows[0].text).toBe('Group 1')
    expect(rows[3].type).toBe('group')
    expect(rows[3].text).toBe('Group 2')
  })
})
