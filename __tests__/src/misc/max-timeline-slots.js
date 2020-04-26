import { config } from '@fullcalendar/preact'

describe('MAX_TIMELINE_SLOTS hook', function() {
  it('is present', function() {
    expect(config.MAX_TIMELINE_SLOTS).toBeTruthy()
  })
})
