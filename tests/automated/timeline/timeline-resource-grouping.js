
describe('timeline resource grouping', function() {
  pushOptions({
    defaultView: 'timeline',
    resourceGroupField: 'groupId',
    resources: [
      {
        id: 'A',
        groupId: '1',
        title: 'Resource A'
      },
      {
        id: 'B',
        groupId: '1',
        title: 'Resource B'
      },
      {
        id: 'C',
        groupId: '2',
        title: 'Resource C'
      }
    ]
  })


  function getRows() { // TODO: consolidate with getVisibleResourceIds
    return $('.fc-body .fc-resource-area tr').map(function(i, node) {
      const $tr = $(node)
      const resourceId = $tr.data('resource-id')
      const text = $tr.find('.fc-cell-text').text()

      if (resourceId) {
        return {
          type: 'resource',
          resourceId,
          text
        }
      } else if ($tr.find('.fc-divider').length) {
        return {
          type: 'divider',
          text
        }
      } else {
        return {}
      }
    }).get()
  }


  it('renders the hierarchy correctly', function() {
    initCalendar()
    const rows = getRows()
    expect(rows.length).toBe(5)
    expect(rows[0].type).toBe('divider')
    expect(rows[0].text).toBe('1')
    expect(rows[1].resourceId).toBe('A')
    expect(rows[2].resourceId).toBe('B')
    expect(rows[3].type).toBe('divider')
    expect(rows[3].text).toBe('2')
    expect(rows[4].resourceId).toBe('C')
  })


  it('renders base off resourceGroupText function', function() {
    initCalendar({
      resourceGroupText(groupId) {
        return `Group ${groupId}`
      }
    })

    const rows = getRows()
    expect(rows.length).toBe(5)
    expect(rows[0].type).toBe('divider')
    expect(rows[0].text).toBe('Group 1')
    expect(rows[3].type).toBe('divider')
    expect(rows[3].text).toBe('Group 2')
  })
})
