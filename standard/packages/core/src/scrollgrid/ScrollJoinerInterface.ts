import { ScrollController2 } from "./ScrollController2.js"

export interface ScrollJoinerClassInterface {
  new(scrollControllers: ScrollController2[], horizontal?: boolean): ScrollJoinerInterface
}

export interface ScrollJoinerInterface {
  scrollTo(val: number): void
  addScrollListener(listener: () => void): void
}
