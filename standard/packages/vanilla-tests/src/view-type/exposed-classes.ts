import { DayGridView } from '@fullcalendar/daygrid/internal'
import { ListView } from '@fullcalendar/list/internal'
import { TimeGridView } from '@fullcalendar/timegrid/internal'

describe('internal View/Grid classes', () => {
  it('are exposed', () => {
    expect(typeof DayGridView).toBe('function')
    expect(typeof TimeGridView).toBe('function')
    expect(typeof ListView).toBe('function')
  })
})
