
describe('timeline column grouping', function() {
  pushOptions({
    defaultView: 'timelineDay',
    resourceColumns: [
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
    initCalendar()
    const resourceTrs = $('.fc-body .fc-resource-area tr[data-resource-id]')
    const eventTrs = $('.fc-body .fc-time-area tr[data-resource-id]')
    expect(resourceTrs.length).toBe(6)
    expect(eventTrs.length).toBe(6)

    for (let i = 0; i < resourceTrs.length; i++) {
      const resourceTr = resourceTrs[i]
      const eventTr = eventTrs[i]
      const resourceTd = $(resourceTr).find('td').filter(function() {
        return parseInt($(this).attr('rowspan') || 1) === 1
      })
      const eventTd = $(eventTr).find('td')
      expect(resourceTd.height()).toBe(eventTd.height())
    }
  })

  it('doesnt render twice when date nav', function() {
    initCalendar()
    expect(getResourceCnt()).toBe(6)
    currentCalendar.next()
    expect(getResourceCnt()).toBe(6)
  })
})

function getResourceCnt() {
  return $('.fc-body .fc-time-area tr[data-resource-id]').length
}
