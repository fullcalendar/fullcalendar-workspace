import { buildIsoString } from "./datelib/formatting-utils.js"
import { computeEarliestSegStart } from './common/MoreLinkContainer.js'
import { Seg } from './component/DateComponent.js'

/*
Misc usage
*/
export interface SegSpan {
  start: number
  end: number
}

/*
For input, internal storage (in entriesByLevel), and for SegRect (which extends this) is used for output!
*/
export interface SegEntry {
  index: number // TODO: eventually move completely to seg as key
  seg?: Seg
  segGroup?: SegGroup // given as input if adding hiddenGroups to the hierarchy in a second pass (TODO: rethink)
  span: SegSpan
  thickness?: number // if not defined, a query-func will declare it
}

/*
Used internally, to represent a candidate insertion point within the hierarchy
Exposed for subclasses of SegHierarchy
*/
export interface SegInsertion {
  // All segs witin a single "level" share the same levelCoord
  // As segs accumulate, new interstitial levels can be added. Thus, levelIndex might change
  levelIndex: number
  levelCoord: number // for convenience

  // index WITHIN the level. set to -1 if requesting to create a new level at levelIndex with the new levelCoord
  lateral: number

  // information about the Seg in the prior level this Seg is touching
  touchingLevelIndex: number // -1 if no touching
  touchingLateralIndex: number // -1 if no touching
  touchingEntry?: SegEntry // the last touching entry in the level

  // the max traversal depth through prior levels
  stackDepth: number
}

/*
For output
*/
export interface SegRect extends SegEntry {
  thickness: number // TODO: rename to 'size' ?
  levelCoord: number
}

export class SegHierarchy {
  // settings
  strictOrder: boolean = false
  allowReslicing: boolean = false
  maxCoord: number = -1 // -1 means no max
  maxStackDepth: number = -1 // -1 means no max
  // ^^^ can change mid-processing! (see timeline event-placement). TODO: make this an function param?

  levelCoords: number[] = [] // ordered
  entriesByLevel: SegEntry[][] = [] // parallel with levelCoords

  // stores results, via lookup with buildEntryKey, of each entry's stackDepth
  // TODO: store within individual data structures
  stackDepths: { [entryId: string]: number } = {}

  constructor(
    private getEntryThickness = (entry: SegEntry): number | undefined => {
      // if no thickness known, assume 1 (if 0, so small it always fits)
      return entry.thickness
    },
  ) {}

  addSegs(inputs: SegEntry[]): SegEntry[] {
    let hiddenEntries: SegEntry[] = []

    for (let input of inputs) {
      this.insertEntry(input, hiddenEntries)
    }

    return hiddenEntries
  }

  insertEntry(entry: SegEntry, hiddenEntries: SegEntry[]): void {
    let entryThickness = this.getEntryThickness(entry)

    if (entryThickness == null) {
      hiddenEntries.push(entry)
    } else {
      let insertion = this.findInsertion(entry, entryThickness)

      if (this.isInsertionValid(insertion, entryThickness)) {
        this.insertEntryAt(entry, insertion)
      } else {
        this.handleInvalidInsertion(insertion, entry, hiddenEntries)
      }
    }
  }

  isInsertionValid(insertion: SegInsertion, entryThickness: number): boolean {
    return (this.maxCoord === -1 || insertion.levelCoord + entryThickness <= this.maxCoord) &&
      (this.maxStackDepth === -1 || insertion.stackDepth < this.maxStackDepth)
  }

  handleInvalidInsertion(insertion: SegInsertion, entry: SegEntry, hiddenEntries: SegEntry[]): void {
    if (this.allowReslicing && insertion.touchingEntry) {
      const hiddenEntry = {
        ...entry,
        span: intersectSpans(entry.span, insertion.touchingEntry.span),
      }

      hiddenEntries.push(hiddenEntry)
      this.splitEntry(entry, insertion.touchingEntry, hiddenEntries)
    } else {
      hiddenEntries.push(entry)
    }
  }

  /*
  Does NOT add what hit the `barrier` into hiddenEntries. Should already be done.
  */
  splitEntry(entry: SegEntry, barrier: SegEntry, hiddenEntries: SegEntry[]): void {
    let entrySpan = entry.span
    let barrierSpan = barrier.span

    // any leftover seg on the start-side of the barrier?
    if (entrySpan.start < barrierSpan.start) {
      this.insertEntry({
        index: entry.index,
        seg: entry.seg,
        thickness: entry.thickness,
        span: { start: entrySpan.start, end: barrierSpan.start },
      }, hiddenEntries)
    }

    // any leftover seg on the end-side of the barrier?
    if (entrySpan.end > barrierSpan.end) {
      this.insertEntry({
        index: entry.index,
        seg: entry.seg,
        thickness: entry.thickness,
        span: { start: barrierSpan.end, end: entrySpan.end },
      }, hiddenEntries)
    }
  }

  insertEntryAt(entry: SegEntry, insertion: SegInsertion): void {
    let { entriesByLevel, levelCoords } = this

    if (insertion.lateral === -1) {
      // create a new level
      insertAt(levelCoords, insertion.levelIndex, insertion.levelCoord)
      insertAt(entriesByLevel, insertion.levelIndex, [entry])
    } else {
      // insert into existing level
      insertAt(entriesByLevel[insertion.levelIndex], insertion.lateral, entry)
    }

    this.stackDepths[buildEntryKey(entry)] = insertion.stackDepth
  }

  /*
  does not care about limits
  */
  findInsertion(newEntry: SegEntry, newEntryThickness: number): SegInsertion {
    let { levelCoords, entriesByLevel, strictOrder, stackDepths } = this
    let levelCnt = levelCoords.length
    let candidateCoord = 0 // a tentative levelCoord for newEntry's placement
    let touchingLevelIndex: number = -1
    let touchingLateralIndex: number = -1
    let touchingEntry: SegEntry = null
    let stackDepth = 0

    // iterate through existing levels
    for (let currentLevelIndex = 0; currentLevelIndex < levelCnt; currentLevelIndex += 1) {
      const currentLevelCoord = levelCoords[currentLevelIndex]

      // if the current level has cleared newEntry's bottom coord, we have found a good empty space and can stop.
      // if strictOrder, keep finding more lateral intersections.
      if (!strictOrder && currentLevelCoord >= candidateCoord + newEntryThickness) {
        break
      }

      let currentLevelEntries = entriesByLevel[currentLevelIndex]
      let currentEntry: SegEntry

      // finds the first possible entry that newEntry could intersect with
      let [searchIndex, isExact] = binarySearch(currentLevelEntries, newEntry.span.start, getEntrySpanEnd) // find first entry after newEntry's end
      let lateralIndex = searchIndex + isExact // if exact match (which doesn't collide), go to next one

      // loop through entries that horizontally intersect
      while (
        (currentEntry = currentLevelEntries[lateralIndex]) && // but not past the whole entry list
        currentEntry.span.start < newEntry.span.end // and not entirely past newEntry
      ) {
        let currentEntryBottom = currentLevelCoord + this.getEntryThickness(currentEntry)

        // intersects into the top of the candidate?
        if (currentEntryBottom > candidateCoord) {
          // push it downward so doesn't 'vertically' intersect anymore
          candidateCoord = currentEntryBottom

          // tentatively record as touching
          touchingEntry = currentEntry
          touchingLevelIndex = currentLevelIndex
          touchingLateralIndex = lateralIndex
        }

        // does current entry butt up against top of candidate?
        // will obviously happen if just intersected, but can also happen if pushed down previously
        // because intersected with a sibling
        // TODO: after automated tests hooked up, see if these gate is unnecessary,
        // we might just be able to do this for ALL intersecting currentEntries (this whole loop)
        if (currentEntryBottom === candidateCoord) {
          // accumulate the highest possible stackDepth of the currentLevelEntries that butt up
          stackDepth = Math.max(stackDepth, stackDepths[buildEntryKey(currentEntry)] + 1)
        }

        lateralIndex += 1
      }
    }

    // the destination level will be after touchingEntry's level. find it
    // TODO: can reuse work from above?
    let destLevel = 0
    if (touchingEntry) {
      destLevel = touchingLevelIndex + 1
      while (destLevel < levelCnt && levelCoords[destLevel] < candidateCoord) {
        destLevel += 1
      }
    }

    // if adding to an existing level, find where to insert
    // TODO: can reuse work from above?
    let destLateral = -1
    if (destLevel < levelCnt && levelCoords[destLevel] === candidateCoord) {
      [destLateral] = binarySearch(entriesByLevel[destLevel], newEntry.span.end, getEntrySpanEnd)
    }

    return {
      touchingLevelIndex,
      touchingLateralIndex,
      touchingEntry,
      stackDepth,
      levelCoord: candidateCoord,
      levelIndex: destLevel,
      lateral: destLateral,
    }
  }

  // sorted by levelCoord (lowest to highest)
  toRects(): SegRect[] {
    let { entriesByLevel, levelCoords } = this
    let levelCnt = entriesByLevel.length
    let rects: SegRect[] = []

    for (let level = 0; level < levelCnt; level += 1) {
      let entries = entriesByLevel[level]
      let levelCoord = levelCoords[level]

      for (let entry of entries) {
        rects.push({
          ...entry,
          thickness: this.getEntryThickness(entry), // called to many times!
          levelCoord,
        })
      }
    }

    return rects
  }
}

export function getEntrySpanEnd(entry: SegEntry) {
  return entry.span.end
}

/*
Generates a unique ID whose lifespan is a single run of SegHierarchy, so can be really specific
without fear of accidentally busting the cache on subsequent rerenders
*/
export function buildEntryKey(entry: SegEntry) {
  return entry.index + ':' + entry.span.start
}

// Grouping
// -------------------------------------------------------------------------------------------------

export interface SegGroup {
  key: string
  span: SegSpan
  segs: Seg[]
}

interface SegEntryMerge {
  span: SegSpan
  entries: SegEntry[]
}

/*
returns groups with entries sorted by input order
*/
export function groupIntersectingEntries(entries: SegEntry[]): SegGroup[] {
  let merges: SegEntryMerge[] = []

  for (let entry of entries) {
    let filteredMerges: SegEntryMerge[] = []
    let hungryMerge: SegEntryMerge = { // the merge that will eat what it collides with
      span: entry.span,
      entries: [entry],
    }

    for (let merge of merges) {
      if (intersectSpans(merge.span, hungryMerge.span)) {
        hungryMerge = {
          span: joinSpans(merge.span, hungryMerge.span),
          entries: merge.entries.concat(hungryMerge.entries), // keep preexisting merge's items first. maintains order
        }
      } else {
        filteredMerges.push(merge)
      }
    }

    filteredMerges.push(hungryMerge)
    merges = filteredMerges
  }

  return merges.map((merge) => {
    const segs = merge.entries.map(extractEntrySeg)
    return {
      key: buildIsoString(computeEarliestSegStart(segs)),
      span: merge.span,
      segs,
    }
  })
}

function extractEntrySeg(entry: SegEntry): Seg {
  return entry.seg
}

// Seg Geometry
// -------------------------------------------------------------------------------------------------

export function joinSpans(span0: SegSpan, span1: SegSpan): SegSpan {
  return {
    start: Math.min(span0.start, span1.start),
    end: Math.max(span0.end, span1.end),
  }
}

export function intersectSpans(span0: SegSpan, span1: SegSpan): SegSpan | null {
  let start = Math.max(span0.start, span1.start)
  let end = Math.min(span0.end, span1.end)

  if (start < end) {
    return { start, end }
  }

  return null
}

// General Util
// -------------------------------------------------------------------------------------------------

function insertAt<Item>(arr: Item[], index: number, item: Item) {
  arr.splice(index, 0, item)
}

export function binarySearch<Item>(
  a: Item[],
  searchVal: number,
  getItemVal: (item: Item) => number,
): [number, number] { // returns [level, isExactMatch ? 1 : 0]
  let startIndex = 0
  let endIndex = a.length // exclusive

  if (!endIndex || searchVal < getItemVal(a[startIndex])) { // no items OR before first item
    return [0, 0]
  }
  if (searchVal > getItemVal(a[endIndex - 1])) { // after last item
    return [endIndex, 0]
  }

  while (startIndex < endIndex) {
    let middleIndex = Math.floor(startIndex + (endIndex - startIndex) / 2)
    let middleVal = getItemVal(a[middleIndex])

    if (searchVal < middleVal) {
      endIndex = middleIndex
    } else if (searchVal > middleVal) {
      startIndex = middleIndex + 1
    } else { // equal!
      return [middleIndex, 1]
    }
  }

  return [startIndex, 0]
}
