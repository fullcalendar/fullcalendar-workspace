import { Calendar } from 'fullcalendar'
import { CalendarWrapper } from '@fullcalendar-tests/standard/lib/wrappers/CalendarWrapper'
import { TimelineViewWrapper } from './wrappers/TimelineViewWrapper'

/*
Utils for DST-transition tests, where the standard date-keyed wrapper utils
(getSlatElByDate, getLeft, clickDate, ...) are ambiguous: during a fall-back
transition, TWO slats share the same civil data-date. Everything here is
index/point-based instead.

America/New_York reference dates (2024):
- FALL_BACK_DAY: Sun Nov 3. 2:00 EDT (-04:00) -> 1:00 EST (-05:00).
  Civil day spans 25 real hours (04:00Z through 05:00Z next day).
  With 30-min slots: 50 slats. Wallclocks 01:00/01:30 each appear TWICE
  (first copy at slat indexes 2-3, second copy at 4-5, 02:00 at 6).
- SPRING_FORWARD_DAY: Sun Mar 10. 2:00 EST -> 3:00 EDT.
  Civil day spans 23 real hours. With 30-min slots: 46 slats.
  Wallclocks 02:00/02:30 don't exist (01:30 at index 3, 03:00 at index 4).
*/

export const NY_TIME_ZONE = 'America/New_York'
export const FALL_BACK_DAY = '2024-11-03'
export const SPRING_FORWARD_DAY = '2024-03-10'
export const DST_TIMELINE_BASE_OPTIONS = {
  timeZone: NY_TIME_ZONE,
  initialView: 'timelineDay',
  initialDate: FALL_BACK_DAY,
  scrollTime: '00:00',
  slotDuration: '00:30',
}

export const FALL_BACK_FIRST_0100_SLAT = 2
export const FALL_BACK_FIRST_0130_SLAT = 3
export const FALL_BACK_SECOND_0100_SLAT = 4
export const FALL_BACK_SECOND_0130_SLAT = 5
export const FALL_BACK_0200_SLAT = 6

export interface SlatInfo {
  el: HTMLElement
  dateStr: string // the civil data-date. NOT unique during a fall-back fold
  left: number
  right: number
  top: number
  bottom: number
}

export interface Point {
  left: number
  top: number
}

export function getSlatInfo(grid: { getSlatEls(): HTMLElement[] }): SlatInfo[] {
  return grid.getSlatEls().map((el) => {
    const rect = el.getBoundingClientRect()
    return {
      el,
      dateStr: el.getAttribute('data-date'),
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
    }
  })
}

export function getSlatCenter(slat: SlatInfo): Point {
  return {
    left: (slat.left + slat.right) / 2,
    top: (slat.top + slat.bottom) / 2,
  }
}

// a point just inside the slat's start edge. use as dragEventToPoint dest so
// the grab offset can't push the pointer past a narrow slat's far edge
export function getSlatStartPoint(slat: SlatInfo): Point {
  return {
    left: slat.left + 1,
    top: (slat.top + slat.bottom) / 2,
  }
}

export function clickPoint(point: Point): Promise<void> {
  return new Promise<void>((resolve) => {
    $.simulateByPoint('drag', {
      point,
      onRelease: () => resolve(),
    })
  })
}

export function dragFromPointToPoint(point0: Point, point1: Point): Promise<void> {
  return new Promise<void>((resolve) => {
    $.simulateByPoint('drag', {
      point: point0,
      end: point1,
      onRelease: () => resolve(),
    })
  })
}

/*
Like ResourceTimelineGridWrapper.dragEventTo, but with an explicit destination
point. Grabs the event near its start edge so the event's start snaps to the
slat containing destPoint.
*/
export function dragEventToPoint(eventEl: HTMLElement, destPoint: Point): Promise<void> {
  const GRAB_OFFSET = 10

  return new Promise<void>((resolve) => {
    $(eventEl).simulate('drag', {
      localPoint: { left: GRAB_OFFSET, top: '50%' },
      end: { left: destPoint.left + GRAB_OFFSET, top: destPoint.top },
      onRelease: () => resolve(),
    })
  })
}

/*
Like TimelineGridWrapper.resizeEvent, but with an explicit destination point.
Drop the resizer INSIDE the last slat the event should cover — the event's end
becomes that slat's exclusive end.
*/
export function resizeEventToPoint(eventEl: HTMLElement, destPoint: Point, fromStart?: boolean): Promise<void> {
  return new Promise<void>((resolve) => {
    const resizerEl = $(eventEl).find(
      '.' + (fromStart ? CalendarWrapper.EVENT_START_RESIZER_CLASSNAME : CalendarWrapper.EVENT_END_RESIZER_CLASSNAME),
    ).css('display', 'block')[0] // usually only displays on hover. force display

    $(resizerEl).simulate('drag', {
      end: destPoint,
      onRelease: () => resolve(),
    })
  })
}

export function expectCloseTo(actual: number, expected: number, tolerance = 3) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

export function expectEventSpansSlats(
  calendar: Calendar,
  startSlatIndex: number,
  endSlatIndexExclusive: number,
  eventIndex = 0,
) {
  let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
  let slats = getSlatInfo(timelineGrid)
  let eventRect = timelineGrid.getEventEls()[eventIndex].getBoundingClientRect()

  expectCloseTo(eventRect.left, slats[startSlatIndex].left)
  expectCloseTo(eventRect.right, slats[endSlatIndexExclusive].left)
}

// dateStrs of consecutive slats, for readable whole-axis assertions
export function getSlatDateStrs(slats: SlatInfo[], startIndex: number, count: number): string[] {
  return slats.slice(startIndex, startIndex + count).map((slat) => slat.dateStr)
}
