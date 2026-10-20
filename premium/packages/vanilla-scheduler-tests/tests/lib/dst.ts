/*
America/New_York DST transitions in 2024, for timeline tests with 30-minute slots.
During fall-back, two slots share each wall-clock time from 01:00 to 01:30, so tests address
those slots by index.

- FALL_BACK_DAY: Sun Nov 3. 02:00 EDT (-04:00) -> 01:00 EST (-05:00). 50 slots.
  01:00 and 01:30 appear twice: first at indexes 2-3, second at 4-5. 02:00 is at 6.
- SPRING_FORWARD_DAY: Sun Mar 10. 02:00 EST -> 03:00 EDT. 46 slots.
  02:00 and 02:30 don't exist: 01:30 is at index 3, 03:00 at index 4.
*/
export const FALL_BACK_DAY = '2024-11-03'
export const SPRING_FORWARD_DAY = '2024-03-10'

export const DST_TIMELINE_OPTIONS = {
  timeZone: 'America/New_York',
  initialView: 'timelineDay',
  initialDate: FALL_BACK_DAY,
  scrollTime: '00:00',
  slotDuration: '00:30',
}

export const FALL_BACK_SECOND_0130_SLOT = 5
export const FALL_BACK_0200_SLOT = 6
export const SPRING_FORWARD_0300_SLOT = 4

/*
For comparing a rendered event edge with a slot edge. Sub-pixel layout can differ by a pixel.
*/
export function expectCloseTo(actual: number, expected: number, tolerance = 1.5): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ${actual} to be within ${tolerance}px of ${expected}`)
  }
}
