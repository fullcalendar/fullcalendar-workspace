import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

/*
TODO: write tests for text/render functions
*/
describe('timeline column grouping', () => {
  pushOptions({
    initialView: 'resourceTimelineDay',
    resourceAreaColumns: [
      {
        group: true,
        headerContent: 'col1',
        field: 'col1',
      },
      {
        group: true,
        headerContent: 'col2',
        field: 'col2',
      },
      {
        headerContent: 'col3',
        field: 'col3',
      },
    ],
    resources: [
      { id: 'a', col1: 'Group A', col2: 'Group 2', col3: 'One' },
      { id: 'b', col1: 'Group A', col2: 'Group 2', col3: 'Two' },
      { id: 'c', col1: 'Group A', col2: 'Group 2', col3: 'Three' },
      { id: 'd', col1: 'Group B', col2: 'Group 1', col3: 'One' },
      { id: 'e', col1: 'Group B', col2: 'Group 2', col3: 'One' },
      { id: 'f', col1: 'Group C', col2: 'Group 1', col3: 'One' },
    ],
  })

  it('renders row heights correctly when grouping columns', () => {
    let calendar = initCalendar()
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    let resourceDataCells = viewWrapper.dataGrid.getResourceInfo().map((info) => info.cellEl)
    let resourceLaneCells = viewWrapper.timelineGrid.getResourceLaneEls()
    expect(resourceDataCells.length).toBe(6)
    expect(resourceLaneCells.length).toBe(6)

    for (let i = 0; i < resourceDataCells.length; i += 1) {
      let resourceDataCell = resourceDataCells[i]
      let resourceLaneCell = resourceLaneCells[i]

      expect(
        Math.round(resourceDataCell.offsetHeight),
      ).toBe(
        Math.round(resourceLaneCell.offsetHeight),
      )
    }
  })

  it('doesnt render twice when date nav', () => {
    let calendar = initCalendar()
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    expect(viewWrapper.getResourceCnt()).toBe(6)
    currentCalendar.next()
    expect(viewWrapper.getResourceCnt()).toBe(6)
  })
})
