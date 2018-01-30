
describe('timeline rendering', function() {
  pushOptions({
    defaultDate: '2017-10-27'
  })

  function buildResources(cnt) {
    const resources = []
    for (let i = 0; i < cnt; i++) {
      resources.push({ title: `resource${i}` })
    }
    return resources
  }

  function getSpreadsheetScrollEl() {
    return $('.fc-body .fc-resource-area .fc-scroller')[0]
  }

  function getTimeScrollEl() {
    return $('.fc-body .fc-time-area .fc-scroller')[0]
  }


  it('has correct vertical scroll and gutters', function() {
    initCalendar({
      defaultView: 'timeline',
      resources: buildResources(50)
    })

    const spreadsheetEl = getSpreadsheetScrollEl()
    const timeEl = getTimeScrollEl()

    expect(spreadsheetEl.scrollHeight).toBeGreaterThan(0)
    expect(timeEl.scrollHeight).toBeGreaterThan(0)

    const gutter = timeEl.clientHeight - spreadsheetEl.clientHeight
    expect(spreadsheetEl.scrollHeight + gutter)
      .toEqual(timeEl.scrollHeight)
  })


  it('renders time slots localized', function() {
    initCalendar({
      defaultView: 'timelineWeek',
      slotDuration: '01:00',
      scrollTime: 0,
      locale: 'lv'
    })

    expect(
      $('.fc-head .fc-time-area th:first .fc-cell-text').text()
    ).toBe('P 23.10.2017.')
  })
})
