import { config } from '@fullcalendar/core'

describe('MAX_TIMELINE_SLOTS hook', function() {
  it('is present', function() {
    expect(config.MAX_TIMELINE_SLOTS).toBeTruthy()
  })
})
