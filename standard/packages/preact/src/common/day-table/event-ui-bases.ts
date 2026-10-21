import { EventDef, EventDefHash } from '../../structs/event-def'
import { EventUi, EventUiHash, combineEventUis } from '../../component-util/event-ui'
import { DayTableLane, isDefInLane } from './keying'

/*
Per-key event UI bases, in three layers with separate caches: which keys each current def belongs
to (per store), the individual (per-def) bases partitioned by key and lane, then each key's full
bases (a per-key memoize, so one key's change leaves the others' objects alone).

A def's individual base (its source's UI) reaches a key only if the def belongs to that key, and
lane, in the current store. So a mirror dragged from one key or lane into another is compiled
without its source's base.
*/

export function buildDefKeys(
  defs: EventDefHash,
  keysForEventDef: (def: EventDef) => string[],
): { [defId: string]: string[] } {
  let defKeys: { [defId: string]: string[] } = {}

  for (let defId in defs) {
    defKeys[defId] = keysForEventDef(defs[defId])
  }

  return defKeys
}

// the keys with at least one def in the lane
export function buildLaneKeysWithDefs(
  defs: EventDefHash,
  defKeys: { [defId: string]: string[] },
  lane: DayTableLane,
): { [key: string]: true } {
  let keysWithDefs: { [key: string]: true } = {}

  for (let defId in defs) {
    if (isDefInLane(defs[defId], lane)) {
      for (let key of defKeys[defId]) {
        keysWithDefs[key] = true
      }
    }
  }

  return keysWithDefs
}

export function splitIndividualUi(
  eventUiBases: EventUiHash,
  defKeys: { [defId: string]: string[] },
  defs: EventDefHash,
  lane: DayTableLane,
): { [key: string]: EventUiHash } {
  let splitHashes: { [key: string]: EventUiHash } = {}

  for (let defId in eventUiBases) {
    if (defId) { // not the '' key
      let def = defs[defId]

      if (def && isDefInLane(def, lane)) {
        for (let key of defKeys[defId]) {
          if (!splitHashes[key]) {
            splitHashes[key] = {}
          }

          splitHashes[key][defId] = eventUiBases[defId]
        }
      }
    }
  }

  return splitHashes
}

export function buildEventUiForKey(
  allUi: EventUi | undefined,
  keyUi: EventUi | undefined,
  individualUi: EventUiHash | undefined,
): EventUiHash {
  let baseParts: EventUi[] = []

  if (allUi) {
    baseParts.push(allUi)
  }

  if (keyUi) {
    baseParts.push(keyUi)
  }

  let bases: EventUiHash = {
    '': combineEventUis(baseParts),
  }

  if (individualUi) {
    Object.assign(bases, individualUi)
  }

  return bases
}
