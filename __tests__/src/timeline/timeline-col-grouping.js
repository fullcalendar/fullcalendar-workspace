import ResourceTimelineViewWrapper from "../lib/wrappers/ResourceTimelineViewWrapper"

/*
TODO: write tests for text/render functions
*/
describe('timeline column grouping', function() {
  pushOptions({
    defaultView: 'resourceTimelineDay',
    resourceAreaColumns: [
      {
        group: true,
        labelText: 'col1',
        field: 'col1'
      },
      {
        group: true,
        labelText: 'col2',
        field: 'col2'
      },
      {
        labelText: 'col3',
        field: 'col3'
      }
    ],
    resources: [
      { id: 'a', col1: 'Group A', col2: 'Group 2', col3: 'One' },
      { id: 'b', col1: 'Group A', col2: 'Group 2', col3: 'Two' },
      { id: 'c', col1: 'Group A', col2: 'Group 2', col3: 'Three' },
      { id: 'd', col1: 'Group B', col2: 'Group 1', col3: 'One' },
      { id: 'e', col1: 'Group B', col2: 'Group 2', col3: 'One' },
      { id: 'f', col1: 'Group C', col2: 'Group 1', col3: 'One' }
    ]
  })

  it('renders row heights correctly when grouping columns', function() {
    let calendar = initCalendar()
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    let resourceTrs = viewWrapper.dataGrid.getResourceRowEls()
    let eventTrs = viewWrapper.timelineGrid.getResourceRowEls()
    expect(resourceTrs.length).toBe(6)
    expect(eventTrs.length).toBe(6)

    for (let i = 0; i < resourceTrs.length; i++) {
      let resourceTr = resourceTrs[i]
      let eventTr = eventTrs[i]
      let resourceTd = $(resourceTr).find('td').filter(function() {
        return parseInt($(this).attr('rowspan') || '1') === 1
      })
      let eventTd = $(eventTr).find('td')

      expect(
        Math.round(resourceTd.height())
      ).toBe(
        Math.round(eventTd.height())
      )
    }
  })

  it('doesnt render twice when date nav', function() {
    let calendar = initCalendar()
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    expect(viewWrapper.getResourceCnt()).toBe(6)
    currentCalendar.next()
    expect(viewWrapper.getResourceCnt()).toBe(6)
  })
})

