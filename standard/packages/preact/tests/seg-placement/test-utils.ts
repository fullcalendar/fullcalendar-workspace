import { type SourceSeg } from '../../src/seg-placement/layout'

export type UnorderedSeg<EventMeta = unknown> = Omit<SourceSeg<EventMeta>, 'orderIndex'>

export function stampEventOrder<EventMeta>(
  orderedSegs: readonly UnorderedSeg<EventMeta>[],
): SourceSeg<EventMeta>[] {
  return orderedSegs.map((seg, orderIndex) => ({
    ...seg,
    orderIndex,
  }))
}
