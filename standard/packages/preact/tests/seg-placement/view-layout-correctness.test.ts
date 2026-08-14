import { describe, expect, it } from 'vitest'
import {
  type SourceSeg,
  type Placement,
  type Slice,
  type UnorderedSeg,
  positionSegs,
  stampEventOrder,
} from '../../src/seg-placement/layout'
import {
  calculateTimelineContentHeight,
  limitTimelineLayoutByMaxLevel,
  positionTimelineMoreLinks,
} from '../../src/seg-placement/timeline'
import { layoutTimeGridColumnByMaxLevel } from '../../src/seg-placement/timegrid'

interface TestEvent {
  id: string
}

describe('view projection correctness audits', () => {
  it('audits Timeline groups, link skylines, and expanding height', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const segs = buildScenario(seed)
      const thicknesses = new Map(segs.map((seg, index) => [
        seg.key,
        4 + (seed * 7 + index * 11) % 23,
      ]))
      const unrestricted = positionSegs(segs, thicknesses, seed % 2 === 0)
      const limited = limitTimelineLayoutByMaxLevel(
        unrestricted,
        seed % 5,
        [],
        { orderStrict: seed % 2 === 0 },
      )
      const links = positionTimelineMoreLinks(
        limited.moreLinkGroups,
        limited.levels,
      )
      const heights = new Map(links.map((link, index) => [
        link.key,
        3 + (seed + index * 5) % 17,
      ]))
      const contentHeight = calculateTimelineContentHeight(
        limited.visiblePlacements,
        links,
        heights,
      )
      const label = `Timeline seed ${seed}`

      auditHiddenGroups(limited.hiddenSlices, limited.moreLinkGroups, label)
      for (const link of links) {
        const expectedTop = limited.visiblePlacements.reduce((top, placement) =>
          spansOverlap(link, placement)
            ? Math.max(top, placement.levelEndCoord)
            : top, 0)
        invariant(
          link.levelCoord === expectedTop,
          `${link.key} has top ${link.levelCoord}; expected ${expectedTop}`,
          label,
        )
      }

      const expectedHeight = Math.max(
        0,
        ...limited.visiblePlacements.map((placement) => placement.levelEndCoord),
        ...links.map((link) => link.levelCoord + heights.get(link.key)!),
      )
      invariant(
        contentHeight === expectedHeight,
        `content height ${contentHeight}; expected ${expectedHeight}`,
        label,
      )
    }
  })

  it('audits TimeGrid pressure geometry and hidden-link groups', () => {
    for (let seed = 1; seed <= 2_000; seed++) {
      const segs = buildScenario(seed)
      for (const orderStrict of [false, true]) {
        const result = layoutTimeGridColumnByMaxLevel(
          segs,
          seed % 5,
          { orderStrict },
        )
        const label = JSON.stringify({ kind: 'TimeGrid', seed, orderStrict })
        const placements = result.domOrderedPlacements

        expect(placements.map((item) => item.sourceSeg.key).sort(), label)
          .toEqual(result.limited.visiblePlacements.map((item) => item.sourceSeg.key).sort())
        auditHiddenGroups(result.limited.hiddenSlices, result.moreLinkGroups, label)

        for (const placement of placements) {
          invariant(
            Number.isFinite(placement.levelCoord) &&
              Number.isFinite(placement.thickness),
            `${placement.sourceSeg.key} has non-finite level geometry`,
            label,
          )
          invariant(
            placement.levelCoord >= 0 &&
              placement.thickness > 0 &&
              placement.levelEndCoord <= 1 + Number.EPSILON * 8,
            `${placement.sourceSeg.key} has out-of-range level geometry`,
            label,
          )
          invariant(
            Number.isInteger(placement.backwardDepth) &&
              placement.backwardDepth >= 0 &&
              Number.isInteger(placement.forwardDepth) &&
              placement.forwardDepth >= 0,
            `${placement.sourceSeg.key} has invalid collision depths`,
            label,
          )
        }

        auditTimeGridCollisionSeparation(placements, label)
      }
    }
  })

  it('keeps a shared TimeGrid child beyond every colliding parent', () => {
    const segs = stampEventOrder([
      seg('left-parent', 1, 3),
      seg('right-parent', 3, 6.25),
      seg('shared-child', 2.75, 3.75),
      seg('left-sibling', 0.75, 2.25),
      seg('right-child', 3.75, 7.25),
      seg('right-grandchild', 4.5, 7.25),
    ])
    const placements = layoutTimeGridColumnByMaxLevel(
      segs,
      3,
      { orderStrict: false },
    ).domOrderedPlacements

    auditTimeGridCollisionSeparation(placements, 'shared-child regression')
    const leftParent = placements.find((item) =>
      item.sourceSeg.key === 'left-parent',
    )!
    const sharedChild = placements.find((item) =>
      item.sourceSeg.key === 'shared-child',
    )!
    expect(sharedChild.levelCoord).toBeGreaterThanOrEqual(
      leftParent.levelEndCoord,
    )
  })

  it('covers https://github.com/fullcalendar/fullcalendar/issues/7914 without forbidden overlap', () => {
    const segs = issue7914Segs()
    const placements = layoutTimeGridColumnByMaxLevel(
      segs,
      segs.length,
      { orderStrict: true },
    ).domOrderedPlacements

    auditTimeGridCollisionSeparation(
      placements,
      'https://github.com/fullcalendar/fullcalendar/issues/7914',
    )
  })

  it('covers https://github.com/fullcalendar/fullcalendar/issues/7879 without a zero-width event', () => {
    const segs = issue7879Segs()
    const placements = layoutTimeGridColumnByMaxLevel(
      segs,
      segs.length,
      { orderStrict: false },
    ).domOrderedPlacements

    expect(placements.find((event) => event.sourceSeg.key === '86987')
      ?.thickness).toBeGreaterThan(0)
  })
})

function auditHiddenGroups(
  hiddenSlices: readonly Slice<TestEvent>[],
  groups: readonly {
    start: number
    end: number
    count: number
    hiddenSlices: Slice<TestEvent>[]
  }[],
  label: string,
): void {
  const groupedSlices = groups.flatMap((group) => group.hiddenSlices)
  invariant(
    groupedSlices.length === hiddenSlices.length &&
      hiddenSlices.every((slice) => groupedSlices.includes(slice)),
    'hidden groups do not contain each hidden slice exactly once',
    label,
  )

  for (let index = 0; index < groups.length; index++) {
    const group = groups[index]
    invariant(
      group.hiddenSlices.length > 0 &&
        group.start === Math.min(...group.hiddenSlices.map((item) => item.start)) &&
        group.end === Math.max(...group.hiddenSlices.map((item) => item.end)),
      `group ${index} does not match its slice union`,
      label,
    )
    invariant(
      group.count === new Set(
        group.hiddenSlices.map((item) => item.sourceSeg.key),
      ).size,
      `group ${index} has an incorrect distinct-source count`,
      label,
    )
    for (const slice of group.hiddenSlices) {
      invariant(
        spansOverlap(group, slice),
        `group ${index} contains a non-intersecting slice`,
        label,
      )
    }
    if (index > 0) {
      invariant(
        groups[index - 1].end <= group.start,
        `groups ${index - 1} and ${index} overlap`,
        label,
      )
    }
  }
}

function auditTimeGridCollisionSeparation(
  placements: readonly Placement<TestEvent>[],
  label: string,
): void {
  for (let leftIndex = 0; leftIndex < placements.length; leftIndex++) {
    const left = placements[leftIndex]
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < placements.length;
      rightIndex++
    ) {
      const right = placements[rightIndex]
      if (!spansOverlap(left, right)) continue
      invariant(
        left.levelEndCoord <= right.levelCoord + Number.EPSILON * 8 ||
          right.levelEndCoord <= left.levelCoord + Number.EPSILON * 8,
        `${left.sourceSeg.key} ${JSON.stringify(projectTimeGridPlacement(left))} ` +
          `and ${right.sourceSeg.key} ${JSON.stringify(projectTimeGridPlacement(right))} ` +
          'overlap on the level axis',
        label,
      )
    }
  }
}

function projectTimeGridPlacement(
  placement: Placement<TestEvent>,
): unknown {
  return {
    time: [placement.start, placement.end],
    level: placement.levelIndex,
    levelCoords: [
      placement.levelCoord,
      placement.levelEndCoord,
    ],
  }
}

function seg(
  key: string,
  start: number,
  end: number,
): UnorderedSeg<TestEvent> {
  return {
    key,
    meta: { id: key },
    start,
    end,
    isStart: true,
    isEnd: true,
  }
}

/**
 * Exact event geometry and resolved custom ordering from
 * https://github.com/fullcalendar/fullcalendar/issues/7914
 */
function issue7914Segs(): SourceSeg<TestEvent>[] {
  const ranges: [string, number, number, string][] = [
    ['0', 14, 14.5, '030'],
    ['1', 14.5, 15, '030'],
    ['2', 15, 16, '010'],
    ['3', 16, 16.5, '030'],
    ['4', 16.5, 17, '030'],
    ['5', 17, 17.5, '030'],
    ['6', 18, 19, '020'],
    ['7', 10, 12, '095'],
    ['8', 12, 14, '095'],
    ['9', 14.5, 16.5, '085'],
    ['10', 16.5, 18.5, '085'],
    ['11', 16.5, 18.5, '095'],
    ['12', 10, 11, '030'],
    ['13', 11, 12, '110'],
    ['14', 14, 14.5, '040'],
    ['15', 16, 17, '010'],
    ['16', 17, 17.5, '030'],
    ['17', 17.5, 18, '030'],
    ['18', 11, 12, '110'],
    ['19', 17.5, 18, '030'],
    ['20', 13.5, 14, '040'],
    ['21', 18, 19, '010'],
    ['22', 12.5, 14, '115'],
    ['23', 14, 15.5, '115'],
    ['24', 14.5, 16.5, '115'],
    ['25', 15.5, 16, '110'],
    ['26', 10, 11, '010'],
    ['27', 13.5, 14, '110'],
    ['28', 18.5, 20.5, '105'],
    ['29', 14, 15, '040'],
    ['30', 16, 17, '040'],
    ['31', 15.5, 17, '075'],
  ]
  return stampEventOrder(
    ranges
      .sort((left, right) => left[3].localeCompare(right[3]))
      .map(([key, start, end]) => seg(key, start, end)),
  )
}

/**
 * Exact day-clipped geometry and default start/duration order from
 * https://github.com/fullcalendar/fullcalendar/issues/7879
 */
function issue7879Segs(): SourceSeg<TestEvent>[] {
  const ranges: [string, number, number][] = [
    ['86987', 10, 13],
    ['86988', 0, 8],
    ['86989', 0, 8],
    ['86990', 8, 22],
    ['86991', 6, 8],
    ['86992', 8, 16.5],
    ['86993', 8, 13],
    ['86994', 8, 12],
    ['86995', 8.5, 9.5],
    ['86996', 8.5, 8.75],
    ['86997', 11.5, 14.5],
    ['86998', 13, 17],
    ['86999', 17, 23],
    ['87000', 18, 23],
    ['87001', 14, 24],
    ['87002', 14, 22],
    ['87003', 16, 23],
    ['87004', 15.5, 23.5],
    ['87005', 18, 23],
  ]
  return stampEventOrder(
    ranges
      .sort((left, right) =>
        left[1] - right[1] ||
        (right[2] - right[1]) - (left[2] - left[1]),
      )
      .map(([key, start, end]) => seg(key, start, end)),
  )
}

function buildScenario(seed: number): SourceSeg<TestEvent>[] {
  let state = seed
  const random = () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
  return Array.from({ length: 24 }, (_, index) => {
    const start = Math.floor(random() * 36) / 4
    const end = Math.min(10, start + 0.25 + Math.floor(random() * 16) / 4)
    const key = `${seed}:${index}`
    return {
      key,
      meta: { id: key },
      orderIndex: index,
      start,
      end,
      isStart: true,
      isEnd: true,
    }
  })
}

function spansOverlap(
  left: { start: number; end: number },
  right: { start: number; end: number },
): boolean {
  return left.start < right.end && right.start < left.end
}

function invariant(condition: boolean, message: string, label: string): void {
  if (!condition) throw new Error(`${message}\n${label}`)
}
