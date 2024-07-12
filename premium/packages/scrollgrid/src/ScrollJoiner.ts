import { ScrollController2, ScrollJoinerInterface } from "@fullcalendar/core/internal"

export class ScrollJoiner implements ScrollJoinerInterface {
  x: number
  y: number

  constructor(
    public scrollControllers: ScrollController2[],
    public horizontal = false,
  ) {
  }

  scrollTo(val: number): void {
  }

  // TODO: move to having this debounce, like scrollEnd
  addScrollListener(listener: () => void): void {
  }
}
