import { config } from '@fullcalendar/core'

describe('MAX_TIMELINE_SLOTS hook', () => {
  it('is present', () => {
    expect(config.MAX_TIMELINE_SLOTS).toBeTruthy()
  })
})
