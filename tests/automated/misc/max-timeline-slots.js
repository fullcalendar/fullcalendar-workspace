import { globalHooks } from '@fullcalendar/core'

describe('MAX_TIMELINE_SLOTS hook', function() {
  it('is present', function() {
    expect(globalHooks.MAX_TIMELINE_SLOTS).toBeTruthy()
  })
})
