import { describe, expect, it } from 'vitest'
import { initCalendar } from '../lib/calendar'

describe('destroy', () => {
  it.each(['ltr', 'rtl'] as const)('restores the root element (%s)', (direction) => {
    const calendar = initCalendar({ direction })
    expect(calendar.el.getAttribute('data-fc-part')).toBe('root')

    calendar.destroy()

    expect(calendar.el.className).toBe('')
    expect(calendar.el.hasAttribute('dir')).toBe(false)
    expect(calendar.el.hasAttribute('data-fc-part')).toBe(false)
    expect(calendar.el.childNodes.length).toBe(0)
  })
})
