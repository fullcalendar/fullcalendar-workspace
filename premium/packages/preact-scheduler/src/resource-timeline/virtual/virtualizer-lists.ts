import { Virtualizer } from './virtualizer'

/*
Grows (or, if isTrimmed, trims) a list of virtualizers to `count`, one per group column or header row.
New ones come from `create`, and `seed` can copy state from the first. Grows in place, as the list is a
render-time cache owned by the caller
*/
export function syncVirtualizerList<Item>(
  list: Virtualizer<Item>[],
  count: number,
  create: () => Virtualizer<Item>,
  isTrimmed: boolean,
  seed?: (virtualizer: Virtualizer<Item>, first: Virtualizer<Item>) => void,
): Virtualizer<Item>[] {
  const oldLen = list.length

  if (count > oldLen) {
    for (let i = oldLen; i < count; i++) {
      list[i] = create()

      if (seed) {
        seed(list[i], list[0])
      }
    }
  } else if (count < oldLen && isTrimmed) {
    list = list.slice(0, count)
  }

  return list
}
