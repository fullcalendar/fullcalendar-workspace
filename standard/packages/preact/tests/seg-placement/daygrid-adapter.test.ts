import { describe, expect, it } from 'vitest'
import { createWholeSlice } from '../../src/seg-placement/layout'
import { getEventPartKey } from '../../src/daygrid/TableSeg'
import {
  type DayGridEventSeg,
  type DayGridLevelPlacementColumn,
  type DayGridSegPlacementColumn,
  DayGridSliceHeightMap,
  buildDayGridKernelSources,
  buildDayGridLevelPlacements,
  buildDayGridPixelPlacements,
  buildDayGridPopoverSegs,
  buildDayGridSegPlacementPlan,
  buildDayGridSegPlacements,
  buildDayGridSegSources,
  computeDayGridDomCandidateMaxLevels,
  computeDayGridMeasuredLimits,
  computeDayGridMoreLinkHeight,
  computeDayGridMoreLinkLevelTax,
  createDayGridPlacementOwnerState,
  observeDayGridCanvasHeight,
  observeDayGridSliceHeight,
  resolveDayGridPlacementMode,
} from '../../src/daygrid/seg-placement-adapter'

describe('DayGrid production placement adapter', () => {
  it('builds integer-column sources with stable production identity and order', () => {
    const first = makeSeg('first', 1, 3, { isEnd: false })
    const second = makeSeg('second', 0, 1, { isStart: false })
    const sources = buildDayGridSegSources([first, second])

    expect(sources).toMatchObject([
      {
        key: 'first:1',
        start: 1,
        end: 3,
        isStart: true,
        isEnd: false,
        orderIndex: 0,
      },
      {
        key: 'second:0',
        start: 0,
        end: 1,
        isStart: false,
        isEnd: true,
        orderIndex: 1,
      },
    ])
    expect(sources[0].meta).toBe(first)
    expect(sources[1].meta).toBe(second)
  })

  it('builds kernel sources with separate whole-part and event keys', () => {
    const sources = buildDayGridKernelSources([
      makeSeg('event', 2, 4, { isStart: false }),
    ])

    expect(sources[0]).toMatchObject({
      key: 'event:2',
      eventKey: 'event',
      start: 2,
      end: 4,
      isStart: false,
      orderIndex: 0,
    })
  })

  it('collapses provisional slices back to complete mounted sources', () => {
    const plan = buildDayGridSegPlacementPlan([
      makeSeg('left-blocker', 0, 1),
      makeSeg('provisionally-sliced', 0, 2),
      makeSeg('never-mounted', 0, 1),
    ], 1, false, true)

    expect(plan.mountedSegs.map((source) => source.key)).toEqual([
      'left-blocker:0',
      'provisionally-sliced:0',
    ])
    expect(plan.mountedSegs[1]).toMatchObject({
      start: 0,
      end: 2,
      isStart: true,
      isEnd: true,
    })
    expect(plan.unmountedSlices).toHaveLength(1)
    expect(plan.unmountedSlices[0]).toMatchObject({
      start: 0,
      end: 1,
      sourceSeg: { key: 'never-mounted:0' },
    })
  })

  it('repositions complete measured wrappers and federates final slices by start column', () => {
    const plan = buildDayGridSegPlacementPlan([
      makeSeg('left', 0, 1),
      makeSeg('wide', 0, 2),
    ], Infinity, false, true)
    const columns = buildDayGridSegPlacements(
      plan,
      new Map([
        ['left:0', 10],
        ['wide:0', 10],
      ]),
      {
        levelCoordLimit: 10,
        columnCount: 2,
      },
    )

    // The wide source is sliced, so its permanent wrapper becomes an inert
    // donor in its own start column and its visible piece renders separately.
    expect(itemTops(columns, 0)).toEqual({ 'left:0': 0, 'wide:0': undefined })
    expect(columns[0].domItems).toMatchObject([
      { key: 'left:0', isMeasurable: true, seg: { start: 0, end: 1 } },
      { key: 'wide:0', isMeasurable: true, seg: { start: 0, end: 2 } },
    ])
    expect(columns[1].domItems).toMatchObject([{
      key: 'wide:1:slice',
      top: 0,
      isMeasurable: false,
      seg: { start: 1, end: 2, isSlice: true },
    }])
    expect(columns.map((column) => column.contentHeight)).toEqual([10, 10])
    expect(segIds(columns[0].segs)).toEqual(['left', 'wide'])
    expect(segIds(columns[0].hiddenSegs)).toEqual(['wide'])
    expect(segIds(columns[1].segs)).toEqual(['wide'])
    expect(columns[1].hiddenSegs).toEqual([])
  })

  it('mounts inert donors for every admitted source before measurement settles', () => {
    const plan = buildDayGridSegPlacementPlan([
      makeSeg('a', 0, 1),
      makeSeg('b', 0, 1),
    ], 2, false, false)
    const columns = buildDayGridSegPlacements(
      plan,
      new Map([['a:0', 10]]),
      { maxLevels: 2, columnCount: 1 },
    )

    // One admitted source is still unmeasured, so every node remains inert
    expect(itemTops(columns, 0)).toEqual({ 'a:0': undefined, 'b:0': undefined })
    expect(columns[0].domItems.every((item) => item.isMeasurable)).toBe(true)
    expect(columns[0].contentHeight).toBe(0)
    expect(columns[0].hiddenSegs).toEqual([])
  })

  it('unions candidate and measured hides, deduplicates, and restores event order', () => {
    const plan = buildDayGridSegPlacementPlan([
      makeSeg('first', 0, 1),
      makeSeg('wide-second', 0, 2),
      makeSeg('unmounted-third', 0, 1),
    ], 1, false, true)
    const sources = new Map(plan.sourceSegs.map((source) => [source.key, source]))
    const measuredHidden = [
      createWholeSlice(sources.get('unmounted-third:0')!),
      createWholeSlice(sources.get('first:0')!),
      createWholeSlice(sources.get('wide-second:0')!),
    ]
    const left = buildDayGridPopoverSegs(plan, measuredHidden, 0, 2)
    const right = buildDayGridPopoverSegs(plan, measuredHidden, 1, 2)

    expect(segIds(left.segs)).toEqual(['first', 'wide-second', 'unmounted-third'])
    expect(segIds(left.hiddenSegs)).toEqual(['first', 'wide-second', 'unmounted-third'])
    expect(segIds(right.segs)).toEqual(['wide-second'])
    expect(segIds(right.hiddenSegs)).toEqual(['wide-second'])
    expect(left.hiddenSegs.find((seg) => segId(seg) === 'wide-second')).toMatchObject({
      start: 0,
      end: 1,
      isStart: true,
      isEnd: false,
    })
    expect(right.hiddenSegs[0]).toMatchObject({
      start: 1,
      end: 2,
      isStart: false,
      isEnd: true,
    })
  })
})

describe('DayGridRows placement owner state', () => {
  it('aggregates extrema across rows and grows the candidate frontier monotonically', () => {
    const initial = createDayGridPlacementOwnerState()
    const afterTallEvent = observeDayGridSliceHeight(initial, 30)
    const afterTallArea = observeDayGridCanvasHeight(afterTallEvent, 220)
    const afterShortEvent = observeDayGridSliceHeight(afterTallArea, 10)

    expect(initial).toEqual({
      smallestSliceHeight: null,
      largestSliceHeight: null,
      largestCanvasHeight: null,
      neededLevelCount: 8,
    })
    expect(afterTallEvent).toMatchObject({
      smallestSliceHeight: 30,
      largestSliceHeight: 30,
      neededLevelCount: 8,
    })
    expect(afterTallArea).toMatchObject({
      largestCanvasHeight: 220,
      neededLevelCount: 8,
    })
    expect(afterShortEvent).toMatchObject({
      smallestSliceHeight: 10,
      largestSliceHeight: 30,
      largestCanvasHeight: 220,
      neededLevelCount: 22,
    })
    expect(observeDayGridSliceHeight(afterShortEvent, 40)).toMatchObject({
      smallestSliceHeight: 10,
      largestSliceHeight: 40,
      neededLevelCount: 22,
    })
    expect(observeDayGridCanvasHeight(afterShortEvent, 100)).toBe(afterShortEvent)
  })

  it('uses one producer for valid insertion, owner ratchets, and deletion', () => {
    let owner = observeDayGridCanvasHeight(createDayGridPlacementOwnerState(), 100)
    let changes = 0
    const heights = new DayGridSliceHeightMap(
      (height) => { owner = observeDayGridSliceHeight(owner, height) },
      () => { changes += 1 },
    )
    const ref = heights.createRef('slice')

    ref(0.5)
    expect(heights.current.get('slice')).toBe(0.5)
    expect(owner).toMatchObject({
      smallestSliceHeight: 0.5,
      largestSliceHeight: 0.5,
      neededLevelCount: 200,
    })

    ref(30)
    expect(owner.largestSliceHeight).toBe(30)
    expect(heights.current.get('slice')).toBeLessThanOrEqual(
      owner.largestSliceHeight!,
    )
    ref(null)
    expect(heights.current.has('slice')).toBe(false)
    expect(changes).toBe(3)
  })

  it('rejects non-positive and non-finite producer reports', () => {
    let owner = createDayGridPlacementOwnerState()
    let changes = 0
    const heights = new DayGridSliceHeightMap(
      (height) => { owner = observeDayGridSliceHeight(owner, height) },
      () => { changes += 1 },
    )

    for (const unusable of [0, -5, NaN, Infinity]) {
      heights.handleValue(unusable, 'slice')
    }

    expect(heights.current.size).toBe(0)
    expect(owner).toEqual(createDayGridPlacementOwnerState())
    expect(changes).toBe(0)
  })

  it('derives the more-link reservation from current row event heights', () => {
    const heights = new Map([
      ['short', 10],
      ['tall', 24],
    ])

    expect(computeDayGridMoreLinkHeight(heights)).toBe(24)
    heights.set('tall', 6)
    expect(computeDayGridMoreLinkHeight(heights)).toBe(10)
    heights.clear()
    expect(computeDayGridMoreLinkHeight(heights)).toBe(0)
  })

  it('uses explicit numeric caps, the auto frontier, and no cap for unlimited rows', () => {
    expect(computeDayGridDomCandidateMaxLevels(undefined, undefined, 9)).toBe(Infinity)
    expect(computeDayGridDomCandidateMaxLevels(3, 7, 9)).toBe(3)
    expect(computeDayGridDomCandidateMaxLevels(undefined, 4, 9)).toBe(4)
    expect(computeDayGridDomCandidateMaxLevels(true, 4, 9)).toBe(9)
    expect(computeDayGridDomCandidateMaxLevels(3, true, 9)).toBe(9)
  })
})

describe('DayGrid screen mode routing', () => {
  it('reproduces production option precedence, including boolean over numeric', () => {
    expect(resolveDayGridPlacementMode(undefined, undefined)).toBe('unlimited')
    expect(resolveDayGridPlacementMode(2, undefined)).toBe('maxEvents')
    expect(resolveDayGridPlacementMode(undefined, 2)).toBe('maxEventRows')
    expect(resolveDayGridPlacementMode(2, 3)).toBe('maxEvents')
    expect(resolveDayGridPlacementMode(2, true)).toBe('auto')
    expect(resolveDayGridPlacementMode(true, 2)).toBe('auto')
  })

  it('charges a logical level for a more link only under dayMaxEventRows', () => {
    expect(computeDayGridMoreLinkLevelTax('unlimited')).toBe(0)
    expect(computeDayGridMoreLinkLevelTax('maxEvents')).toBe(0)
    expect(computeDayGridMoreLinkLevelTax('maxEventRows')).toBe(1)
    expect(computeDayGridMoreLinkLevelTax('auto')).toBe(0)
  })

  it('gives auto a pixel ceiling and numeric modes a level cap', () => {
    const inputs = {
      candidateMaxLevels: 4,
      columnCount: 7,
      eventAreaHeight: 100,
      moreLinkHeight: 12,
    }

    // Auto's candidate cap is the observed DOM frontier, so it must not reach
    // the measured pass as a display rule.
    expect(computeDayGridMeasuredLimits({ ...inputs, mode: 'auto' })).toEqual({
      maxLevels: undefined,
      levelCoordLimit: 100,
      columnCount: 7,
      levelTax: 0,
      coordTax: 12,
    })
    expect(computeDayGridMeasuredLimits({ ...inputs, mode: 'maxEventRows' })).toEqual({
      maxLevels: 4,
      levelCoordLimit: undefined,
      columnCount: 7,
      levelTax: 1,
      coordTax: 12,
    })
    expect(computeDayGridMeasuredLimits({ ...inputs, mode: 'maxEvents' }))
      .toMatchObject({ maxLevels: 4, levelCoordLimit: undefined, levelTax: 0 })
    expect(computeDayGridMeasuredLimits({ ...inputs, mode: 'unlimited' }))
      .toMatchObject({ maxLevels: 4, levelCoordLimit: undefined, levelTax: 0 })
    // An auto row that has not measured yet carries no ceiling at all.
    expect(computeDayGridMeasuredLimits({
      ...inputs,
      mode: 'auto',
      eventAreaHeight: undefined,
    })).toMatchObject({ maxLevels: undefined, levelCoordLimit: undefined })
  })
})

describe('DayGrid kernel level placement', () => {
  it('renders unlimited stacks immediately with exact and provisional coordinates', () => {
    const columns = layoutLevelRow([
      makeSeg('first', 0, 1),
      makeSeg('second', 0, 1),
    ], 1, undefined, undefined, {
      heights: { 'first:0': 12 },
      largestSliceHeight: 25,
    })

    expect(levelItemTops(columns, 0)).toEqual({
      'first:0': 0,
      'second:0': 12,
    })
    expect(columns[0].renderItems.map((item) => item.heightRef)).toEqual([
      'ref:first:0',
      'ref:second:0',
    ])
    expect(columns[0].contentHeight).toBe(37)
    expect(columns[0].hiddenSegs).toEqual([])
  })

  it('mounts partial slices with their own keys, refs, and planning heights', () => {
    const columns = layoutLevelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, 1, undefined, {
      heights: {
        'wide:0:slice': 12,
        'blocker:1': 18,
      },
      largestSliceHeight: 25,
    })

    expect(levelItemTops(columns, 0)).toEqual({ 'wide:0:slice': 0 })
    expect(levelItemTops(columns, 1)).toEqual({ 'blocker:1': 0 })
    expect(levelItemTops(columns, 2)).toEqual({ 'wide:2:slice': 0 })
    expect(columns[0].renderItems[0].heightRef).toBe('ref:wide:0:slice')
    expect(columns[2].renderItems[0].heightRef).toBe('ref:wide:2:slice')
    expect(columns.map((column) => column.contentHeight)).toEqual([12, 18, 25])
  })

  it('projects hidden glob slices to ordered, real-boundary cell segs', () => {
    const columns = layoutLevelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
      makeSeg('later', 1, 2),
    ], 3, 1)

    expect(columns.map((column) => segIds(column.hiddenSegs))).toEqual([
      [],
      ['wide', 'later'],
      [],
    ])
    expect(segIds(columns[1].segs)).toEqual(['blocker', 'wide', 'later'])
    expect(columns[1].hiddenSegs[0]).toMatchObject({
      start: 1,
      end: 2,
      isStart: false,
      isEnd: false,
    })
  })

  it('charges the more-link occupant only in numeric rows mode', () => {
    const stack = [
      makeSeg('first', 0, 1),
      makeSeg('second', 0, 1),
      makeSeg('third', 0, 1),
    ]
    const eventsColumns = layoutLevelRow(stack, 1, 2)
    const rowsColumns = layoutLevelRow(stack, 1, undefined, 2)

    expect(Object.keys(levelItemTops(eventsColumns, 0))).toEqual([
      'first:0',
      'second:0',
    ])
    expect(Object.keys(levelItemTops(rowsColumns, 0))).toEqual(['first:0'])
    expect(segIds(rowsColumns[0].hiddenSegs)).toEqual(['second', 'third'])
    expect(rowsColumns[0].contentHeight).toBe(EVENT_HEIGHT)
  })
})

describe('Legacy DayGrid measured adapter (retained without a screen caller)', () => {
  const stack = [
    makeSeg('first', 0, 1),
    makeSeg('second', 0, 1),
    makeSeg('third', 0, 1),
  ]

  it('shows every source and creates no link when unlimited', () => {
    const columns = layoutRow(stack, 1)

    expect(itemTops(columns, 0)).toEqual({
      'first:0': 0,
      'second:0': EVENT_HEIGHT,
      'third:0': EVENT_HEIGHT * 2,
    })
    expect(columns[0].hiddenSegs).toEqual([])
    expect(columns[0].contentHeight).toBe(EVENT_HEIGHT * 3)
  })

  it('spends every numeric dayMaxEvents level on events', () => {
    const columns = layoutRow(stack, 1, 2)

    expect(itemTops(columns, 0)).toEqual({
      'first:0': 0,
      'second:0': EVENT_HEIGHT,
      // rejected before mounting, so it has no wrapper at all
    })
    expect(segIds(columns[0].hiddenSegs)).toEqual(['third'])
    expect(columns[0].contentHeight).toBe(EVENT_HEIGHT * 2)
  })

  it('charges one numeric dayMaxEventRows level to the link', () => {
    const columns = layoutRow(stack, 1, undefined, 2)

    // The candidate pass still admitted two wrappers, so the second stays
    // mounted as an inert donor after the taxed limiter hides it.
    expect(itemTops(columns, 0)).toEqual({
      'first:0': 0,
      'second:0': undefined,
    })
    expect(segIds(columns[0].hiddenSegs)).toEqual(['second', 'third'])
    expect(columns[0].contentHeight).toBe(EVENT_HEIGHT)
  })

  it('hides a whole multi-column source when eventSlicing is off', () => {
    const columns = layoutRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, 1, undefined, { eventSlicing: false })

    expect(itemTops(columns, 0)).toEqual({})
    expect(itemTops(columns, 1)).toEqual({ 'blocker:1': 0 })
    expect(itemTops(columns, 2)).toEqual({})
    expect(columns.map((column) => segIds(column.hiddenSegs)))
      .toEqual([['wide'], ['wide'], ['wide']])
  })

  it('emits column-aligned visible pieces when eventSlicing is on', () => {
    const columns = layoutRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, 1)

    // The whole wrapper stays mounted as a donor and sorts ahead of the
    // supplemental piece sharing its start column.
    expect(columns[0].domItems.map((item) => item.key))
      .toEqual(['wide:0', 'wide:0:slice'])
    expect(itemTops(columns, 0)).toEqual({ 'wide:0': undefined, 'wide:0:slice': 0 })
    expect(itemTops(columns, 1)).toEqual({ 'blocker:1': 0 })
    expect(itemTops(columns, 2)).toEqual({ 'wide:2:slice': 0 })

    // Only the covered day owes a link, and it lists the event as that one day.
    expect(columns.map((column) => segIds(column.hiddenSegs)))
      .toEqual([[], ['wide'], []])
    expect(columns[1].hiddenSegs[0]).toMatchObject({
      start: 1,
      end: 2,
      isStart: false,
      isEnd: false,
    })
    expect(segIds(columns[1].segs)).toEqual(['blocker', 'wide'])
  })

  it('reserves a spanning event its height in every column it crosses', () => {
    // The deepest bottom per column is what reserves room for the normal-flow
    // more link, so a wide event has to raise the columns it merely crosses.
    const columns = layoutRow([
      makeSeg('wide', 0, 2),
      makeSeg('narrow', 2, 3),
    ], 3, undefined, undefined, { heights: { 'wide:0': 30, 'narrow:2': 10 } })

    expect(columns.map((column) => column.contentHeight)).toEqual([30, 30, 10])
  })

  it('keeps a later source below an earlier collider under eventOrderStrict', () => {
    const segs = [
      makeSeg('early', 0, 1),
      makeSeg('overlapper', 0, 2),
      makeSeg('late', 1, 2),
    ]

    expect(itemTops(layoutRow(segs, 2), 1))
      .toEqual({ 'late:1': 0 })
    expect(itemTops(layoutRow(segs, 2, undefined, undefined, { orderStrict: true }), 1))
      .toEqual({ 'late:1': EVENT_HEIGHT * 2 })
  })
})

describe('DayGrid kernel pixel placement', () => {
  /** Two independent stacks of three, so one column can owe a link alone. */
  const twoStacks = [
    makeSeg('a', 0, 1),
    makeSeg('b', 0, 1),
    makeSeg('c', 0, 1),
    makeSeg('d', 1, 2),
    makeSeg('e', 1, 2),
  ]

  it('shows every mounted candidate before the event area has measured', () => {
    const layout = layoutPixelRow(twoStacks, 2)
    const { columns } = layout

    expect(levelItemTops(columns, 0)).toEqual({
      'a:0': 0,
      'b:0': EVENT_HEIGHT,
      'c:0': EVENT_HEIGHT * 2,
    })
    expect(columns.every((column) => !column.hiddenSegs.length)).toBe(true)
    expect(layout.isSettled).toBe(true)
  })

  it('emits a hidden whole donor and self-measuring partials after bounded exclusion', () => {
    const provisional = layoutPixelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, {
      canvasHeight: 15,
      heights: {
        'blocker:1': 5,
        'wide:0': 12,
      },
      smallestSliceHeight: 1,
    })

    expect(levelItemTops(provisional.columns, 0)).toEqual({
      'wide:0': undefined,
      'wide:0:slice': 0,
    })
    expect(levelItemTops(provisional.columns, 1)).toEqual({ 'blocker:1': 0 })
    expect(levelItemTops(provisional.columns, 2)).toEqual({ 'wide:2:slice': 0 })
    expect(provisional.columns[0].renderItems.map((item) => item.heightRef))
      .toEqual(['ref:wide:0', 'ref:wide:0:slice'])
    expect(provisional.isSettled).toBe(false)

    const settled = layoutPixelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, {
      canvasHeight: 15,
      heights: {
        'blocker:1': 5,
        'wide:0:slice': 6,
        'wide:2:slice': 6,
      },
      smallestSliceHeight: 1,
      largestSliceHeight: 12,
    })
    expect(settled.isSettled).toBe(true)
    expect(settled.columns.map((column) => column.contentHeight)).toEqual([6, 5, 6])
  })

  it('keeps bounded exclusions as donors while later wholes can place', () => {
    const layout = layoutPixelRow([
      makeSeg('too-tall', 0, 1),
      makeSeg('later', 1, 2),
    ], 2, {
      canvasHeight: 10,
      heights: { 'too-tall:0': 12, 'later:1': 5 },
    })

    expect(levelItemTops(layout.columns, 0)).toEqual({
      'too-tall:0': undefined,
    })
    expect(levelItemTops(layout.columns, 1)).toEqual({ 'later:1': 0 })
    expect(segIds(layout.columns[0].hiddenSegs)).toEqual(['too-tall'])
    expect(layout.columns.map((column) => column.contentHeight)).toEqual([0, 5])
  })

  it('projects occupant consumption into donors, hidden segs, and content height', () => {
    const layout = layoutPixelRow([
      makeSeg('a', 0, 1),
      makeSeg('b', 0, 1),
      makeSeg('c', 0, 1),
      makeSeg('d', 0, 1),
    ], 1, { canvasHeight: 30 })

    expect(levelItemTops(layout.columns, 0)).toEqual({
      'a:0': 0,
      'b:0': 10,
      'c:0': undefined,
      'd:0': undefined,
    })
    expect(segIds(layout.columns[0].hiddenSegs)).toEqual(['c', 'd'])
    expect(layout.columns[0].contentHeight).toBe(20)
  })

  it('stops mounting candidates beyond the cross-row DOM frontier', () => {
    const { columns } = layoutPixelRow(twoStacks, 2, { neededLevelCount: 2 })

    // The third level never mounts, yet both columns still list their rejected
    // source, because the popover unions unmounted sources with measured hides.
    expect(levelItemTops(columns, 0)).toEqual({ 'a:0': 0, 'b:0': EVENT_HEIGHT })
    expect(segIds(columns[0].hiddenSegs)).toEqual(['c'])
    expect(segIds(columns[0].segs)).toEqual(['a', 'b', 'c'])
  })
})

const EVENT_HEIGHT = 10

/** Mirrors how `DayGridRow` drives the adapter for one fully measured row. */
function layoutRow(
  eventOrderedSegs: DayGridEventSeg[],
  columnCount: number,
  dayMaxEvents?: boolean | number,
  dayMaxEventRows?: boolean | number,
  config: {
    orderStrict?: boolean,
    eventSlicing?: boolean,
    /** Occupied wrapper heights by source key. Defaults to a uniform height. */
    heights?: Record<string, number>,
    /** Measured pixels events compete for. Only an auto row has one. */
    eventAreaHeight?: number,
    /** Cross-row DOM frontier. Only an auto row's candidates consume it. */
    maxDomLevels?: number,
  } = {},
): DayGridSegPlacementColumn[] {
  const plan = buildDayGridSegPlacementPlan(
    eventOrderedSegs,
    computeDayGridDomCandidateMaxLevels(
      dayMaxEvents,
      dayMaxEventRows,
      config.maxDomLevels ?? Infinity,
    ),
    config.orderStrict ?? false,
    config.eventSlicing ?? true,
  )

  const segHeights = new Map(plan.mountedSegs.map((source) => [
    source.key,
    config.heights?.[source.key] ?? EVENT_HEIGHT,
  ]))

  return buildDayGridSegPlacements(
    plan,
    segHeights,
    computeDayGridMeasuredLimits({
      mode: resolveDayGridPlacementMode(dayMaxEvents, dayMaxEventRows),
      candidateMaxLevels: plan.maxLevels,
      columnCount,
      eventAreaHeight: config.eventAreaHeight,
      moreLinkHeight: computeDayGridMoreLinkHeight(segHeights),
    }),
  )
}

function layoutLevelRow(
  eventOrderedSegs: DayGridEventSeg[],
  columnCount: number,
  dayMaxEvents?: number,
  dayMaxEventRows?: number,
  config: {
    orderStrict?: boolean,
    eventSlicing?: boolean,
    heights?: Record<string, number>,
    largestSliceHeight?: number,
  } = {},
): DayGridLevelPlacementColumn<string>[] {
  return buildDayGridLevelPlacements(
    eventOrderedSegs,
    {
      dayMaxEvents,
      dayMaxEventRows,
      orderStrict: config.orderStrict ?? false,
      eventSlicing: config.eventSlicing ?? true,
      columnCount,
    },
    {
      get: (key) => config.heights?.[key],
      createRef: (key) => `ref:${key}`,
    },
    () => ({
      neededLevelCount: Infinity,
      largestSliceHeight: config.largestSliceHeight ?? EVENT_HEIGHT,
    }),
  ).columns
}

function layoutPixelRow(
  eventOrderedSegs: DayGridEventSeg[],
  columnCount: number,
  config: {
    orderStrict?: boolean,
    eventSlicing?: boolean,
    heights?: Record<string, number>,
    canvasHeight?: number,
    neededLevelCount?: number,
    smallestSliceHeight?: number,
    largestSliceHeight?: number,
  } = {},
) {
  const heights = config.heights ?? Object.fromEntries(
    eventOrderedSegs.map((seg) => [getEventPartKey(seg), EVENT_HEIGHT]),
  )
  const measuredHeights = Object.values(heights)

  return buildDayGridPixelPlacements(
    eventOrderedSegs,
    {
      orderStrict: config.orderStrict ?? false,
      eventSlicing: config.eventSlicing ?? true,
      columnCount,
      canvasHeight: config.canvasHeight,
    },
    {
      get: (key) => heights[key],
      createRef: (key) => `ref:${key}`,
    },
    () => ({
      neededLevelCount: config.neededLevelCount ?? 8,
      smallestSliceHeight:
        config.smallestSliceHeight ?? Math.min(...measuredHeights),
      largestSliceHeight:
        config.largestSliceHeight ?? Math.max(...measuredHeights),
      largestCanvasHeight: config.canvasHeight,
    }),
  )
}

/** One column's event nodes as key-to-top, where undefined means inert. */
function itemTops(
  columns: DayGridSegPlacementColumn[],
  column: number,
): Record<string, number | undefined> {
  return Object.fromEntries(
    columns[column].domItems.map((item) => [item.key, item.top]),
  )
}

function levelItemTops(
  columns: DayGridLevelPlacementColumn<string>[],
  column: number,
): Record<string, number | undefined> {
  return Object.fromEntries(
    columns[column].renderItems.map((item) => [item.key, item.style.top]),
  )
}

function makeSeg(
  instanceId: string,
  start: number,
  end: number,
  boundaries: { isStart?: boolean, isEnd?: boolean } = {},
): DayGridEventSeg {
  return {
    start,
    end,
    isStart: boundaries.isStart ?? true,
    isEnd: boundaries.isEnd ?? true,
    eventRange: {
      instance: { instanceId },
    },
  } as DayGridEventSeg
}

function segIds(segs: DayGridEventSeg[]): string[] {
  return segs.map(segId)
}

function segId(seg: DayGridEventSeg): string {
  return seg.eventRange.instance.instanceId
}
