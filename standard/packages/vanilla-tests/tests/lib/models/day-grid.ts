import { getRectCenter, pointer, Point } from '../pointer'
import { waitForSettle } from '../settle'
import { assertGrabbable, getEventEls, getMirrorEls, queryPart, queryParts } from './events'
import { describeSpot, matchesResource, parseSpot, Spot } from './spot'
import { ResizeEdge, resizeSegment } from './resize'

/*
Day cells in a dayGrid view (resource or not), or in a timeGrid view's all-day row.
Dates are `YYYY-MM-DD` strings, matching the cells' data-date attributes. In resource views, a spot
can name the resource: `{ date, resourceId }`.
*/
export class DayGridModel {
  constructor(public root: HTMLElement) {
  }

  /*
  Disabled cells (outside validRange, or non-current with showNonCurrentDates:false) have no data-date,
  so they're found by stepping from a dated cell in the same row.
  */
  getDayCell(spot: Spot): HTMLElement {
    const { date, resourceId } = parseSpot(spot)
    const cell = this.findDatedCell(date, resourceId)

    if (cell) {
      return cell
    }

    for (let dayOffset = 1; dayOffset < 7; dayOffset++) {
      for (const sign of [1, -1]) {
        let neighbor = this.findDatedCell(addDays(date, sign * dayOffset), resourceId)

        for (let i = 0; neighbor && i < dayOffset; i++) {
          neighbor = (sign > 0 ? neighbor.previousElementSibling : neighbor.nextElementSibling) as HTMLElement
        }

        if (neighbor && neighbor.matches('[data-fc-part~="dayCell"]')) {
          return neighbor
        }
      }
    }

    throw new Error(`No day cell for ${describeSpot(spot)}`)
  }

  getEventEls(eventId?: string): HTMLElement[] {
    return getEventEls(this.root, eventId).filter((el) => this.isInDayGrid(el))
  }

  getMirrorEls(): HTMLElement[] {
    return getMirrorEls(this.root).filter((el) => this.isInDayGrid(el))
  }

  /*
  The center of the cell. Fine for dropping and selecting, even over events: hits are
  computed from coordinates. (Not the cell's bottom edge: in a timeGrid all-day row, its bottom
  ~12px doesn't resolve to an all-day hit.)
  */
  pointForDate(spot: Spot): Point {
    const cellEl = this.getDayCell(spot)
    cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const rect = cellEl.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }

  /*
  The point on the event's segment that sits over the cell.
  */
  pointForEventOnDate(eventId: string, spot: Spot): { point: Point, eventEl: HTMLElement } {
    const cellEl = this.getDayCell(spot)
    cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const cellRect = cellEl.getBoundingClientRect()
    const x = cellRect.left + cellRect.width / 2

    const eventEl = this.getEventEls(eventId).find((el) => {
      const rect = el.getBoundingClientRect()
      return rect.left <= x && x <= rect.right && rect.top >= cellRect.top && rect.bottom <= cellRect.bottom
    })

    if (!eventEl) {
      throw new Error(`Event ${eventId} has no segment over ${describeSpot(spot)}`)
    }

    const eventRect = eventEl.getBoundingClientRect()
    const point = { x, y: eventRect.top + eventRect.height / 2 }
    assertGrabbable(point, eventEl, `event ${eventId} on ${describeSpot(spot)}`)
    return { point, eventEl }
  }

  /*
  Clicks the cell's "+more" link and returns the popover. Popovers render outside the calendar root.
  */
  async openMorePopover(spot: Spot): Promise<HTMLElement> {
    const moreLinkEl = queryPart(this.getDayCell(spot), 'moreLink')

    if (!moreLinkEl) {
      throw new Error(`No more-link on ${describeSpot(spot)}`)
    }

    await pointer.click(getRectCenter(moreLinkEl.getBoundingClientRect()))
    await waitForSettle()
    return queryPart(document, 'popover')!
  }

  /*
  Drags the event by its segment over `grab` and drops it on the `drop` cell.
  FullCalendar moves the event by the difference between those dates (and to the drop's resource).
  For cross-section drags, `drop` can compute a point elsewhere (ex: a time slot, from TimeGridModel).
  It's computed after the press, because locating it can scroll, which would move the grab point.
  */
  async dragEvent(eventId: string, grab: Spot, drop: Spot | (() => Point)): Promise<void> {
    const { point: grabPoint } = this.pointForEventOnDate(eventId, grab)
    await pointer.press(grabPoint, async () => {
      const dropPoint = typeof drop === 'function' ? drop() : this.pointForDate(drop)
      await pointer.move(dropPoint)
      await waitForSettle()
    })
    await waitForSettle()
  }

  /*
  Resizes the event's edge from the day it's on to another day (both inclusive days, ex: resizing an
  event's end from Jun 11 to Jun 16 makes it end at the start of Jun 17).
  `whileResizing` runs before release, for checking the mirror.
  */
  async resizeEvent(
    eventId: string,
    edge: ResizeEdge,
    from: Spot,
    to: Spot,
    whileResizing?: () => Promise<void>,
  ): Promise<void> {
    const { eventEl } = this.pointForEventOnDate(eventId, from)
    await resizeSegment(eventEl, edge, () => this.pointForDate(from), () => this.pointForDate(to), whileResizing)
  }

  private findDatedCell(date: string, resourceId: string | undefined): HTMLElement | null {
    const cells = queryParts(this.root, 'dayCell').filter((el) => (
      el.getAttribute('data-date') === date && matchesResource(el, resourceId)
    ))

    if (cells.length > 1) {
      throw new Error(`Expected one day cell for ${date}, found ${cells.length}. Specify a resource?`)
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
