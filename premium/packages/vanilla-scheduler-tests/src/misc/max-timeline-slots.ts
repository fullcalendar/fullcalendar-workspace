import { config } from '@fullcalendar/vanilla/protected-api'

describe('MAX_TIMELINE_SLOTS hook', () => {
  it('is present', () => {
    expect(config.MAX_TIMELINE_SLOTS).toBeTruthy()
  })
})
