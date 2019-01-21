import { globalHooks } from 'fullcalendar'

describe('MAX_TIMELINE_SLOTS hook', function() {
  it('is present', function() {
    expect(globalHooks.MAX_TIMELINE_SLOTS).toBeTruthy()
  })
})
