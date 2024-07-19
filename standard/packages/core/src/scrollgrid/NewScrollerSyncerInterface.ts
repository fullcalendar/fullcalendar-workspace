import { NewScrollerInterface } from "./NewScrollerInterface.js";

export interface NewScrollerSyncerClass {
  new(horizontal?: boolean): NewScrollerSyncerInterface
}

export interface NewScrollerSyncerInterface extends NewScrollerInterface {
  handleChildren(scrollers: NewScrollerInterface[]): void
  destroy(): void
}
