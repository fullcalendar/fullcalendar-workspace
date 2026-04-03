import { ScrollerInterface } from "./ScrollerInterface";

export interface ScrollerSyncerClass {
  new(horizontal?: boolean): ScrollerSyncerInterface
}

export interface ScrollerSyncerInterface extends ScrollerInterface {
  handleChildren(scrollers: ScrollerInterface[]): void
  destroy(): void
  addScrollStartListener(handler: (isUser: boolean) => void): void
  removeScrollStartListener(handler: (isUser: boolean) => void): void
  addScrollListener(handler: (isUser: boolean, scroll: number) => void): void
  removeScrollListener(handler: (isUser: boolean, scroll: number) => void): void
}
