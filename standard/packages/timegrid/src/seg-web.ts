import {
  SegEntry,
  SegHierarchy,
  SegRect,
  buildEntryKey,
  getEntrySpanEnd,
  binarySearch,
  SegGroup,
  groupIntersectingEntries,
} from '@fullcalendar/core/internal'

/*
Output for buildWeb
*/
interface SegNode extends SegEntry {
  nextLevelNodes: SegNode[] // with highest-pressure first
}

/*
Used internally within buildWeb
*/
type SegNodeAndPressure = [ SegNode, number ]

/*
Internal structure. Result from `findNextLevelSegs`
Will ALWAYS have span of 1 or more items. if not, will be null
*/
interface SegSiblingRange {
  level: number
  lateralStart: number
  lateralEnd: number
}

/*
For final output
*/
export interface SegWebRect extends SegRect {
  stackDepth: number
  stackForward: number
}

/*
segEntries assumed sorted
*/
export function buildWebPositioning(
  segEntries: SegEntry[],
  strictOrder?: boolean,
  maxStackDepth?: number,
): [
  segRects: SegWebRect[],
  hiddenGroups: SegGroup[]
] {
  let hierarchy = new SegHierarchy()
  if (strictOrder != null) {
    hierarchy.strictOrder = strictOrder
  }
  if (maxStackDepth != null) {
    hierarchy.maxStackDepth = maxStackDepth
  }

  let hiddenEntries = hierarchy.addSegs(segEntries)
  let hiddenGroups = groupIntersectingEntries(hiddenEntries)

  let web = buildWeb(hierarchy)
  web = stretchWeb(web, 1) // all levelCoords/thickness will have 0.0-1.0
  let segRects = webToRects(web)

  return [segRects, hiddenGroups]
}

/*
TODO: investigate whether this "web" can be built from SegHierarchy
In SegHierarchy::findInsertion, we already find start/end overlaps in lower levels
In buildWeb, we find overlaps in higher levels, but we just need to determine "pressure" and
"chain length", which doesn't care about direction.
*/
function buildWeb(hierarchy: SegHierarchy): SegNode[] {
  const { entriesByLevel } = hierarchy

  const buildNode = cacheable(
    (level: number, lateral: number) => level + ':' + lateral,
    (level: number, lateral: number): SegNodeAndPressure => {
      let siblingRange = findNextLevelSegs(hierarchy, level, lateral)
      let [nextLevelNodes, maxPressure] = buildNodes(siblingRange, buildNode)
      let entry = entriesByLevel[level][lateral]

      return [
        { ...entry, nextLevelNodes },
        entry.thickness + maxPressure, // the pressure builds
      ]
    },
  )

  const [topLevelNodes] = buildNodes(
    entriesByLevel.length
      ? { level: 0, lateralStart: 0, lateralEnd: entriesByLevel[0].length }
      : null,
    buildNode,
  )

  return topLevelNodes
}

function buildNodes(
  siblingRange: SegSiblingRange | null,
  buildNode: (level: number, lateral: number) => SegNodeAndPressure,
): [
  nodes: SegNode[],
  maxPressure: number,
] {
  if (!siblingRange) {
    return [[], 0]
  }

  let { level, lateralStart, lateralEnd } = siblingRange
  let lateral = lateralStart
  let pairs: SegNodeAndPressure[] = []

  while (lateral < lateralEnd) {
    pairs.push(buildNode(level, lateral))
    lateral += 1
  }

  pairs.sort(cmpDescPressures)

  return [
    pairs.map(extractNode), // nodes
    pairs[0][1], // first item's pressure
  ]
}

function cmpDescPressures(a: SegNodeAndPressure, b: SegNodeAndPressure) { // sort pressure high -> low
  return b[1] - a[1]
}

function extractNode(a: SegNodeAndPressure): SegNode {
  return a[0]
}

function findNextLevelSegs(hierarchy: SegHierarchy, subjectLevel: number, subjectLateral: number): SegSiblingRange | null {
  let { levelCoords, entriesByLevel } = hierarchy
  let subjectEntry = entriesByLevel[subjectLevel][subjectLateral]
  let afterSubject = levelCoords[subjectLevel] + subjectEntry.thickness
  let levelCnt = levelCoords.length
  let level = subjectLevel

  // skip past levels that are too high up
  for (; level < levelCnt && levelCoords[level] < afterSubject; level += 1) ; // do nothing

  for (; level < levelCnt; level += 1) {
    let entries = entriesByLevel[level]
    let entry: SegEntry
    let searchIndex = binarySearch(entries, subjectEntry.span.start, getEntrySpanEnd)
    let lateralStart = searchIndex[0] + searchIndex[1] // if exact match (which doesn't collide), go to next one
    let lateralEnd = lateralStart

    while ( // loop through entries that horizontally intersect
      (entry = entries[lateralEnd]) && // but not past the whole seg list
      entry.span.start < subjectEntry.span.end
    ) { lateralEnd += 1 }

    if (lateralStart < lateralEnd) {
      return { level, lateralStart, lateralEnd }
    }
  }

  return null
}

function stretchWeb(topLevelNodes: SegNode[], totalThickness: number): SegNode[] {
  const stretchNode = cacheable(
    (node: SegNode, startCoord: number, prevThickness: number) => buildEntryKey(node),
    (node: SegNode, startCoord: number, prevThickness: number): [number, SegNode] => { // [startCoord, node]
      let { nextLevelNodes, thickness } = node
      let allThickness = thickness + prevThickness
      let thicknessFraction = thickness / allThickness
      let endCoord: number
      let newChildren: SegNode[] = []

      if (!nextLevelNodes.length) {
        endCoord = totalThickness
      } else {
        for (let childNode of nextLevelNodes) {
          if (endCoord === undefined) {
            let res = stretchNode(childNode, startCoord, allThickness)
            endCoord = res[0]
            newChildren.push(res[1])
          } else {
            let res = stretchNode(childNode, endCoord, 0)
            newChildren.push(res[1])
          }
        }
      }

      let newThickness = (endCoord - startCoord) * thicknessFraction
      return [endCoord - newThickness, {
        ...node,
        thickness: newThickness,
        nextLevelNodes: newChildren,
      }]
    },
  )

  return topLevelNodes.map((node: SegNode) => stretchNode(node, 0, 0)[1])
}

// not sorted in any particular order
function webToRects(topLevelNodes: SegNode[]): SegWebRect[] {
  let rects: SegWebRect[] = []

  const processNode = cacheable(
    (node: SegNode, levelCoord: number, stackDepth: number) => buildEntryKey(node),
    (node: SegNode, levelCoord: number, stackDepth: number) => { // returns forwardPressure
      let rect = {
        ...node,
        levelCoord,
        stackDepth,
        stackForward: 0, // will assign after recursing
      } as SegWebRect
      rects.push(rect)

      return (
        rect.stackForward = processNodes(node.nextLevelNodes, levelCoord + node.thickness, stackDepth + 1) + 1
      )
    },
  )

  function processNodes(nodes: SegNode[], levelCoord: number, stackDepth: number) { // returns stackForward
    let stackForward = 0
    for (let node of nodes) {
      stackForward = Math.max(processNode(node, levelCoord, stackDepth), stackForward)
    }
    return stackForward
  }

  processNodes(topLevelNodes, 0, 0)
  return rects // TODO: sort rects by levelCoord to be consistent with toRects?
}

// TODO: move to general util

function cacheable<Args extends any[], Res>(
  keyFunc: (...args: Args) => string,
  workFunc: (...args: Args) => Res,
): ((...args: Args) => Res) {
  const cache: { [key: string]: Res } = {}

  return (...args: Args) => {
    let key = keyFunc(...args)
    return (key in cache)
      ? cache[key]
      : (cache[key] = workFunc(...args))
  }
}
