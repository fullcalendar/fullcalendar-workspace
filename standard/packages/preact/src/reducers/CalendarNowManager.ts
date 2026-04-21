import { DateEnv, DateMarker, DateInput } from '@full-ui/headless-calendar'

/*
TODO: test switching timezones when NO timezone plugin
*/
export class CalendarNowManager {
  private dateEnv?: DateEnv
  private resetListeners = new Set<() => void>()
  // technique 1
  private nowAnchorDate?: Date
  private nowAnchorQueried?: number // epoch-nanoseconds when nowAnchor created
  // technique 2
  private nowFn?: () => DateInput

  handleInput(
    dateEnv: DateEnv, // will change if timezone setup changed
    nowInput: DateInput | (() => DateInput),
  ): void {
    const oldDateEnv = this.dateEnv

    if (dateEnv !== oldDateEnv) {
      if (typeof nowInput === 'function') {
        this.nowFn = nowInput
      } else if (!oldDateEnv) { // first time?
        // real "now" keeps its exact epoch (marker round-trips are ambiguous during DST folds).
        // a `now` INPUT still round-trips through a marker and resolves ambiguous civil times
        // to the first occurrence. TODO (see TODO-instant-fidelity.md): preserve explicit
        // instants from string/Date inputs via parse-time capture
        this.nowAnchorDate = nowInput
          ? dateEnv.toDate(dateEnv.createMarker(nowInput))
          : new Date()
        this.nowAnchorQueried = Date.now()
      }

      this.dateEnv = dateEnv

      // not first time? fire reset handlers
      if (oldDateEnv) {
        for (const resetListener of this.resetListeners.values()) {
          resetListener()
        }
      }
    }
  }

  getDateMarker(): DateMarker {
    return this.nowAnchorDate
      ? this.dateEnv.timestampToMarker(this.getEpochMs())
      : this.dateEnv.createMarker(this.nowFn!())
  }

  /*
  The exact instant of "now". Unlike a DateMarker, unambiguous during DST transitions.
  When `now` was supplied as a function returning a civil time, resolves deterministically.
  */
  getEpochMs(): number {
    return this.nowAnchorDate
      ? this.nowAnchorDate.valueOf() + (Date.now() - this.nowAnchorQueried)
      : this.dateEnv.toDate(this.dateEnv.createMarker(this.nowFn!())).valueOf()
  }

  addResetListener(handler: () => void): void {
    this.resetListeners.add(handler)
  }

  removeResetListener(handler: () => void): void {
    this.resetListeners.delete(handler)
  }
}
