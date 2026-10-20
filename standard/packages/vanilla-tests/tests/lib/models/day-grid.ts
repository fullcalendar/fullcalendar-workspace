import { pointer, Point } from '../pointer'
import { waitForSettle } from '../settle'
import { assertPointHits, getEventEls, getMirrorEls, queryParts } from './events'

/*
Day cells in a dayGrid view, or in a timeGrid view's all-day row.
Dates are `YYYY-MM-DD` strings, matching the cells' data-date attributes.
*/
export class DayGridModel {
  constructor(public root: HTMLElement) {
  }

  /*
  Disabled cells (outside validRange, or non-current with showNonCurrentDates:false) have no data-date,
  so they're found by stepping from a dated cell in the same row.
  */
  getDayCell(date: string): HTMLElement {
    const cell = this.findDatedCell(date)

    if (cell) {
      return cell
    }

    for (let dayOffset = 1; dayOffset < 7; dayOffset++) {
      for (const sign of [1, -1]) {
        let neighbor = this.findDatedCell(addDays(date, sign * dayOffset))

        for (let i = 0; neighbor && i < dayOffset; i++) {
          neighbor = (sign > 0 ? neighbor.previousElementSibling : neighbor.nextElementSibling) as HTMLElement
        }

        if (neighbor && neighbor.matches('[data-fc-part~="dayCell"]')) {
          return neighbor
        }
      }
    }

    throw new Error(`No day cell for ${date}`)
  }

  getEventEls(eventId?: string): HTMLElement[] {
    return getEventEls(this.root, eventId).filter((el) => this.isInDayGrid(el))
  }

  getMirrorEls(): HTMLElement[] {
    return getMirrorEls(this.root).filter((el) => this.isInDayGrid(el))
  }

  /*
  The center of the date's cell. Fine for dropping and selecting, even over events: hits are
  computed from coordinates. (Not the cell's bottom edge: in a timeGrid all-day row, its bottom
  ~12px doesn't resolve to an all-day hit.)
  */
  pointForDate(date: string): Point {
    const cellEl = this.getDayCell(date)
    cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const rect = cellEl.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }

  /*
  The point on the event's segment that sits over the given date's cell.
  */
  pointForEventOnDate(eventId: string, date: string): { point: Point, eventEl: HTMLElement } {
    const cellEl = this.getDayCell(date)
    cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const cellRect = cellEl.getBoundingClientRect()
    const x = cellRect.left + cellRect.width / 2

    const eventEl = this.getEventEls(eventId).find((el) => {
      const rect = el.getBoundingClientRect()
      return rect.left <= x && x <= rect.right && rect.top >= cellRect.top && rect.bottom <= cellRect.bottom
    })

    if (!eventEl) {
      throw new Error(`Event ${eventId} has no segment over ${date}`)
    }

    const eventRect = eventEl.getBoundingClientRect()
    const point = { x, y: eventRect.top + eventRect.height / 2 }
    assertPointHits(point, eventEl, `event ${eventId} on ${date}`)
    return { point, eventEl }
  }

  /*
  Drags the event by its segment over `grab` and drops it on the `drop` date's cell.
  FullCalendar moves the event by the difference between those dates.
  For cross-section drags, `drop` can compute a point elsewhere (ex: a time slot, from TimeGridModel).
  It's computed after the press, because locating it can scroll, which would move the grab point.
  */
  async dragEvent(eventId: string, grab: string, drop: string | (() => Point)): Promise<void> {
    const { point: grabPoint } = this.pointForEventOnDate(eventId, grab)
    await pointer.press(grabPoint, async () => {
      const dropPoint = typeof drop === 'string' ? this.pointForDate(drop) : drop()
      await pointer.move(dropPoint)
      await waitForSettle()
    })
    await waitForSettle()
  }

  private findDatedCell(date: string): HTMLElement | null {
    const cells = queryParts(this.root, 'dayCell').filter((el) => el.getAttribute('data-date') === date)

    if (cells.length > 1) {
      throw new Error(`Expected one day cell for ${date}, found ${cells.length}`)
    }
    return cells[0] || null
  }

  private isInDayGrid(el: HTMLElement): boolean {
    return Boolean(el.closest('[data-fc-part~="dayCell"]'))
  }
}

function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
