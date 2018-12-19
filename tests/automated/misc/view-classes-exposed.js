
describe('internal View classes', function() {

  it('are exposed', function() {
    expect(typeof FullCalendar.TimelineView).toBe('function')
    expect(typeof FullCalendar.ResourceTimelineView).toBe('function')
    expect(typeof FullCalendar.ResourceAgendaView).toBe('function')
    expect(typeof FullCalendar.ResourceBasicView).toBe('function')
  })
})
