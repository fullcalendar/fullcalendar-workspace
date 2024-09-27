
export class ScrollResponder<T> {
  protected queuedScroll?: T

  constructor(
    private _handleScroll: (scroll: T) => boolean, // returns true if success
  ) {}

  handleScroll = (scroll: T) => {
    this.queuedScroll = scroll
    this.drain()
  }

  drain() {
    if (this.queuedScroll) {
      if (this._handleScroll(this.queuedScroll)) {
        this.queuedScroll = undefined
      }
    }
  }
}
