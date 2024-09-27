import { Duration } from '../datelib/duration.js'
import { Emitter } from '../common/Emitter.js'
import { CalendarListeners } from '../options.js'

export class ScrollResponder<T> {
  protected initialized = false
  protected queuedScroll?: T

  constructor(
    public handleScroll: (scroll: T) => void, // TODO: offer more protections?
    private serializeScroll?: () => T,
  ) {}

  handleWillUpdate = () => {
    if (!this.initialized && this.serializeScroll) {
      this.queuedScroll = this.serializeScroll()
    }
    this.initialized = true
  }

  handleDidUpdate = () => {
    if (this.queuedScroll != null) {
      this.handleScroll(this.queuedScroll)
      this.queuedScroll = undefined
    }
  }
}

export type TimeScrollHandler = (scroll: Duration) => void

export class TimeScrollResponder extends ScrollResponder<Duration> {
  constructor(
    handleScroll: TimeScrollHandler,
    private emitter: Emitter<CalendarListeners>,
    private scrollTime: Duration, // TODO: make dynamic
    private scrollTimeReset: boolean, // TODO: make dynamic
  ) {
    super(handleScroll)
    emitter.on('_timeScrollRequest', this.handleScroll)
    this.queuedScroll = scrollTime
  }

  update(isDatesNew: boolean) {
    if (isDatesNew && this.scrollTimeReset) {
      if (this.initialized) {
        this.handleScroll(this.scrollTime)
      } else {
        this.queuedScroll = this.scrollTime
      }
    }
  }

  detach() {
    this.emitter.off('_timeScrollRequest', this.handleScroll)
  }
}
