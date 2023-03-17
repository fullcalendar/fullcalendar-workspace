import { config } from '@fullcalendar/core/internal'

describe('MAX_TIMELINE_SLOTS hook', () => {
  it('is present', () => {
    expect(config.MAX_TIMELINE_SLOTS).toBeTruthy()
  })
})
