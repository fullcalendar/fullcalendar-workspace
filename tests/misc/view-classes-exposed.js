
describe('internal View classes', function() {

  it('are exposed', function() {
    const FC = $.fullCalendar

    expect(typeof FC.TimelineView).toBe('function')
    expect(typeof FC.ResourceTimelineView).toBe('function')
    expect(typeof FC.ResourceAgendaView).toBe('function')
    expect(typeof FC.ResourceBasicView).toBe('function')
    expect(typeof FC.ResourceMonthView).toBe('function')
  })
})
