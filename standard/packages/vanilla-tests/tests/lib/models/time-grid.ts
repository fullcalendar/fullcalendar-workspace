import { pointer, Point } from '../pointer'
import { waitForSettle } from '../settle'
import { DayGridModel } from './day-grid'
import { assertPointHits, getEventEls, getMirrorEls, queryParts } from './events'

/*
A timeGrid view. `allDay` models the all-day row.
Date-times are `YYYY-MM-DDTHH:mm(:ss)` strings in the calendar's time zone, matching the columns'
data-date and the slots' data-time attributes.
*/
export class TimeGridModel {
  allDay: DayGridModel

  constructor(public root: HTMLElement) {
    this.allDay = new DayGridModel(root)
  }

  getDayLane(date: string): HTMLElement {
    const lanes = queryParts(this.root, 'dayLane').filter((el) => el.getAttribute('data-date') === date)

    if (lanes.length !== 1) {
      throw new Error(`Expected one day lane for ${date}, found ${lanes.length}`)
    }
    return lanes[0]
  }

  getSlotLanes(): HTMLElement[] {
    return queryParts(this.root, 'slotLane')
  }

  getEventEls(eventId?: string): HTMLElement[] {
    return getEventEls(this.root, eventId).filter((el) => this.isInLane(el))
  }

  getMirrorEls(): HTMLElement[] {
    return getMirrorEls(this.root).filter((el) => this.isInLane(el))
  }

  /*
  A point in the date's column, just below where the time starts. Scrolls the time into view.
  */
  pointForDateTime(dateTime: string): Point {
    const [date, time] = splitDateTime(dateTime)
    const y = this.yForTime(time)
    const laneRect = this.getDayLane(date).getBoundingClientRect()
    return { x: laneRect.left + laneRect.width / 2, y }
  }

  /*
  The point on the event's segment in `dateTime`'s column, at that time.
  The time must be within the event.
  */
  pointForEventAt(eventId: string, dateTime: string): { point: Point, eventEl: HTMLElement } {
    const [date, time] = splitDateTime(dateTime)
    const y = this.yForTime(time)
    const laneEl = this.getDayLane(date)
    const eventEl = this.getEventEls(eventId).find((el) => laneEl.contains(el))

    if (!eventEl) {
      throw new Error(`Event ${eventId} has no segment on ${date}`)
    }

    const eventRect = eventEl.getBoundingClientRect()
    const point = { x: eventRect.left + eventRect.width / 2, y }
    assertPointHits(point, eventEl, `event ${eventId} at ${dateTime}`)
    return { point, eventEl }
  }

  /*
  Drags the event by its segment at `grab` (a date-time within the event) and releases at `drop`.
  FullCalendar treats the press as if it were at the center of the grabbed slot, so the event moves
  by the pointer's travel rounded to the nearest slot (or snap). With slot-aligned times, that's
  exactly the difference between `grab` and `drop`.
  For cross-section drags, `drop` can compute a point elsewhere (ex: an all-day cell).
  It's computed after the press, because locating it can scroll, which would move the grab point.
  */
  async dragEvent(eventId: string, grab: string, drop: string | (() => Point)): Promise<void> {
    const { point: grabPoint } = this.pointForEventAt(eventId, grab)
    await pointer.press(grabPoint, async () => {
      const dropPoint = typeof drop === 'string' ? this.pointForDateTime(drop) : drop()
      await pointer.move(dropPoint)
      await waitForSettle()
    })
    await waitForSettle()
  }

  /*
  Just below the time's position, so the point is unambiguously within the slot (or snap interval)
  that starts there. Assumes snap intervals are taller than 2px.
  */
  private yForTime(time: string): number {
    const slotEls = this.getSlotLanes()
    const slotMs = getSlotStartMs(slotEls)
    const ms = parseTimeMs(time)
    let i = slotMs.length - 1

    while (i > 0 && slotMs[i] > ms) {
      i--
    }

    const slotDurationMs = slotMs.length > 1
      ? (i + 1 < slotMs.length ? slotMs[i + 1] : slotMs[i] + (slotMs[i] - slotMs[i - 1])) - slotMs[i]
      : NaN
    const frac = (ms - slotMs[i]) / slotDurationMs

    if (!(frac >= 0 && frac < 1)) { // also rejects NaN
      throw new Error(`Time ${time} is outside the rendered slots`)
    }

    const slotEl = slotEls[i]
    slotEl.scrollIntoView({ block: 'nearest' })
    const rect = slotEl.getBoundingClientRect()
    return rect.top + rect.height * frac + 2
  }

  private isInLane(el: HTMLElement): boolean {
    return Boolean(el.closest('[data-fc-part~="dayLane"]'))
  }
}

function splitDateTime(dateTime: string): [string, string] {
  const [date, time] = dateTime.split('T')

  if (!time) {
    throw new Error(`Expected a date-time, got ${dateTime}`)
  }
  return [date, time]
}

/*
Slot start times, as ms from the day's start. data-time wraps after midnight when slotMaxTime is past
24h, so later slots get a day added to keep the sequence increasing.
*/
function getSlotStartMs(slotEls: HTMLElement[]): number[] {
  const res: number[] = []

  for (const slotEl of slotEls) {
    let ms = parseTimeMs(slotEl.getAttribute('data-time')!)

    while (res.length && ms <= res[res.length - 1]) {
      ms += 24 * 60 * 60 * 1000
    }
    res.push(ms)
  }

  return res
}

function parseTimeMs(time: string): number {
  const [h, m = '0', s = '0'] = time.split(':')
  return ((Number(h) * 60 + Number(m)) * 60 + Number(s)) * 1000
}
