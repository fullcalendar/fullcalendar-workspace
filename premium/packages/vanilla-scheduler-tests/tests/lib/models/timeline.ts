import { pointer, Point } from '@fullcalendar-tests/standard/tests/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { assertGrabbable, getEventEls, getMirrorEls, queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { describeSpot, parseSpot, Spot } from '@fullcalendar-tests/standard/tests/lib/models/spot'
import { ResizeEdge, resizeSegment } from '@fullcalendar-tests/standard/tests/lib/models/resize'

/*
A spot, or the start of a slot by index (for slots that share a wall-clock time, ex: when DST ends).
*/
export type TimelineSpot = Spot | { slot: number, resourceId?: string }

/*
A timeline view (resource or not). Time runs horizontally across slots, whose data-date attributes
are wall-clock date-times (`YYYY-MM-DDTHH:mm:ss`, or `YYYY-MM-DD` for day-sized slots).
In resource timelines, a spot can name the resource's lane: `{ date, resourceId }`.
*/
export class TimelineModel {
  constructor(public root: HTMLElement) {
  }

  getSlotLanes(): HTMLElement[] {
    return queryParts(this.root, 'slotLane').filter((el) => el.hasAttribute('data-date'))
  }

  getResourceLane(resourceId: string): HTMLElement {
    const lane = queryParts(this.root, 'resourceLane').find((el) => el.getAttribute('data-resource-id') === resourceId)

    if (!lane) {
      throw new Error(`No lane for resource ${resourceId}`)
    }
    return lane
  }

  getEventEls(eventId?: string, resourceId?: string): HTMLElement[] {
    return getEventEls(this.root, eventId).filter((el) => (
      resourceId == null || el.closest('[data-fc-part~="resourceLane"]')?.getAttribute('data-resource-id') === resourceId
    ))
  }

  getMirrorEls(): HTMLElement[] {
    return getMirrorEls(this.root)
  }

  pointForDateTime(spot: Spot): Point {
    const { date, resourceId } = parseSpot(spot)
    return { x: this.xForDateTime(date), y: this.yForResource(resourceId) }
  }

  /*
  A point just inside the start of the slot at `index`, for slots that share a wall-clock time
  (ex: the repeated hour when DST ends).
  */
  pointForSlot(index: number, resourceId?: string): Point {
    const slotEl = this.getSlotLanes()[index]
    slotEl.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    return { x: this.xInSlot(slotEl, 0), y: this.yForResource(resourceId) }
  }

  /*
  The point on the event's segment at `spot`'s time. The time must be within the event.
  */
  pointForEventAt(eventId: string, spot: Spot): { point: Point, eventEl: HTMLElement } {
    const { date, resourceId } = parseSpot(spot)
    const x = this.xForDateTime(date)
    const eventEl = this.getEventEls(eventId, resourceId).find((el) => {
      const rect = el.getBoundingClientRect()
      return rect.left <= x && x <= rect.right
    })

    if (!eventEl) {
      throw new Error(`Event ${eventId} has no segment at ${describeSpot(spot)}`)
    }

    // Timeline events are resizable from both ends by default, through handles that only take up
    // space while hovered. So grab away from the edges. Within the grabbed slot, the exact x doesn't
    // matter: FullCalendar treats the press as if it were at the slot's center.
    const eventRect0 = eventEl.getBoundingClientRect()
    const edgeMargin = 10
    if (eventRect0.width < edgeMargin * 2) {
      throw new Error(`Event ${eventId} is too narrow to grab away from its resize handles`)
    }
    const grabX = Math.min(Math.max(x, eventRect0.left + edgeMargin), eventRect0.right - edgeMargin)

    const eventRect = eventEl.getBoundingClientRect()
    const point = { x: grabX, y: eventRect.top + eventRect.height / 2 }
    assertGrabbable(point, eventEl, `event ${eventId} at ${describeSpot(spot)}`)
    return { point, eventEl }
  }

  /*
  Drags the event by its segment at `grab` and releases at `drop`. As in timeGrid, FullCalendar
  treats the press as if it were at the center of the grabbed slot, so the event moves by the
  pointer's travel rounded to the nearest slot (and to the drop's resource).
  */
  async dragEvent(eventId: string, grab: Spot, drop: Spot | (() => Point)): Promise<void> {
    const { point: grabPoint } = this.pointForEventAt(eventId, grab)
    await pointer.press(grabPoint, async () => {
      const dropPoint = typeof drop === 'function' ? drop() : this.pointForDateTime(drop)
      await pointer.move(dropPoint)
      await waitForSettle()
    })
    await waitForSettle()
  }

  /*
  Resizes the event's edge from one time to another (ex: an end from 05:00 to 07:30). `from` must be
  where the edge currently is, and also names the segment's resource lane.
  `whileResizing` runs before release, for checking the mirror.
  */
  async resizeEvent(
    eventId: string,
    edge: ResizeEdge,
    from: TimelineSpot,
    to: TimelineSpot,
    whileResizing?: () => Promise<void>,
  ): Promise<void> {
    const fromResourceId = typeof from === 'object' ? from.resourceId : undefined
    const eventEls = this.getEventEls(eventId, fromResourceId)

    if (eventEls.length !== 1) {
      throw new Error(`Expected one segment of event ${eventId}, found ${eventEls.length}`)
    }

    await resizeSegment(eventEls[0], edge, () => this.pointForSpot(from), () => this.pointForSpot(to), whileResizing)
  }

  private pointForSpot(spot: TimelineSpot): Point {
    return typeof spot === 'object' && 'slot' in spot
      ? this.pointForSlot(spot.slot, spot.resourceId)
      : this.pointForDateTime(spot)
  }

  private xForDateTime(dateTime: string): number {
    const slotEls = this.getSlotLanes()
    const slotMs = slotEls.map((el) => parseWallClockMs(el.getAttribute('data-date')!))
    const ms = parseWallClockMs(dateTime)
    let i = slotMs.length - 1

    while (i > 0 && slotMs[i] > ms) {
      i--
    }

    const slotDurationMs = slotMs.length > 1
      ? (i + 1 < slotMs.length ? slotMs[i + 1] : slotMs[i] + (slotMs[i] - slotMs[i - 1])) - slotMs[i]
      : NaN
    const frac = (ms - slotMs[i]) / slotDurationMs

    if (!(frac >= 0 && frac < 1)) { // also rejects NaN
      throw new Error(`Time ${dateTime} is outside the rendered slots`)
    }

    slotEls[i].scrollIntoView({ block: 'nearest', inline: 'nearest' })
    return this.xInSlot(slotEls[i], frac)
  }

  // Just past the time's position in the slot, from the slot's start edge (the right edge in RTL)
  private xInSlot(slotEl: HTMLElement, frac: number): number {
    const rect = slotEl.getBoundingClientRect()
    const isRtl = getComputedStyle(this.root).direction === 'rtl'

    return isRtl
      ? rect.right - rect.width * frac - 2
      : rect.left + rect.width * frac + 2
  }

  private yForResource(resourceId: string | undefined): number {
    const el = resourceId != null ? this.getResourceLane(resourceId) : this.getSlotLanes()[0]
    el.scrollIntoView({ block: 'nearest' })
    const rect = el.getBoundingClientRect()
    return rect.top + rect.height / 2
  }
}

function parseWallClockMs(dateTime: string): number {
  return Date.parse(dateTime.includes('T') ? dateTime + 'Z' : dateTime + 'T00:00:00Z')
}
