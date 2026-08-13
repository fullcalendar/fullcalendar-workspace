import { describe, expect, it } from 'vitest'
import { createWholeSlice } from '../../src/seg-placement/layout'
import {
  type DayGridEventSeg,
  type DayGridSegPlacementColumn,
  buildDayGridPopoverSegs,
  buildDayGridSegPlacementPlan,
  buildDayGridSegPlacements,
  buildDayGridSegSources,
  computeDayGridDomCandidateMaxLevels,
  computeDayGridMeasuredLimits,
  computeDayGridMoreLinkLevelTax,
  createDayGridPlacementOwnerState,
  observeDayGridEventAreaHeight,
  observeDayGridEventHeight,
  observeDayGridMoreLinkHeight,
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
    const afterTallEvent = observeDayGridEventHeight(initial, 30)
    const afterTallArea = observeDayGridEventAreaHeight(afterTallEvent, 220)
    const afterShortEvent = observeDayGridEventHeight(afterTallArea, 10)

    expect(initial).toEqual({
      smallestEventHeight: null,
      largestEventAreaHeight: null,
      maxDomLevels: 8,
      largestMoreLinkHeight: 0,
    })
    expect(afterTallEvent).toMatchObject({
      smallestEventHeight: 30,
      maxDomLevels: 8,
    })
    expect(afterTallArea).toMatchObject({
      largestEventAreaHeight: 220,
      maxDomLevels: 8,
    })
    expect(afterShortEvent).toMatchObject({
      smallestEventHeight: 10,
      largestEventAreaHeight: 220,
      maxDomLevels: 22,
    })
    expect(observeDayGridEventHeight(afterShortEvent, 40)).toBe(afterShortEvent)
    expect(observeDayGridEventAreaHeight(afterShortEvent, 100)).toBe(afterShortEvent)
  })

  it('admits an implausibly small height but ignores unusable reports', () => {
    const measured = observeDayGridEventAreaHeight(createDayGridPlacementOwnerState(), 100)

    // A transient sub-pixel measurement during font/stylesheet loading is
    // deliberately not clamped: it can only widen the candidate frontier, and
    // the measured pass still decides visibility from real pixels.
    expect(observeDayGridEventHeight(measured, 0.5)).toMatchObject({
      smallestEventHeight: 0.5,
      maxDomLevels: 200,
    })

    for (const unusable of [0, -5, NaN, Infinity, null as any]) {
      expect(observeDayGridEventHeight(measured, unusable)).toBe(measured)
    }
  })

  it('keeps one parent-wide monotone more-link maximum', () => {
    const initial = createDayGridPlacementOwnerState()
    const first = observeDayGridMoreLinkHeight(initial, 12)

    expect(first.largestMoreLinkHeight).toBe(12)
    expect(observeDayGridMoreLinkHeight(first, 5)).toBe(first)
    expect(observeDayGridMoreLinkHeight(first, 18).largestMoreLinkHeight).toBe(18)
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

describe('DayGrid measured screen placement', () => {
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

describe('DayGrid measured auto placement', () => {
  /** Two independent stacks of three, so one column can owe a link alone. */
  const twoStacks = [
    makeSeg('a', 0, 1),
    makeSeg('b', 0, 1),
    makeSeg('c', 0, 1),
    makeSeg('d', 1, 2),
    makeSeg('e', 1, 2),
  ]

  it('shows every mounted candidate before the event area has measured', () => {
    const columns = layoutRow(twoStacks, 2, true)

    expect(itemTops(columns, 0)).toEqual({
      'a:0': 0,
      'b:0': EVENT_HEIGHT,
      'c:0': EVENT_HEIGHT * 2,
    })
    expect(columns.every((column) => !column.hiddenSegs.length)).toBe(true)
  })

  it('admits an auto row down to its measured pixel ceiling', () => {
    const columns = layoutRow(twoStacks, 2, true, undefined, {
      eventAreaHeight: EVENT_HEIGHT * 2.5,
    })

    // Nothing has measured a link yet, so the ceiling is spent entirely on
    // events and only the source that could not reach it is hidden.
    expect(itemTops(columns, 0)).toEqual({
      'a:0': 0,
      'b:0': EVENT_HEIGHT,
      'c:0': undefined,
    })
    expect(segIds(columns[0].hiddenSegs)).toEqual(['c'])
  })

  it('charges the measured link height to owing columns only', () => {
    const columns = layoutRow(twoStacks, 2, true, undefined, {
      eventAreaHeight: EVENT_HEIGHT * 2.5,
      moreLinkHeight: EVENT_HEIGHT * 1.2,
    })

    // Hiding `c` activates the left column, whose lowered ceiling then evicts
    // `b`. The right column never owed a link, so it keeps its full stack.
    expect(itemTops(columns, 0)).toEqual({
      'a:0': 0,
      'b:0': undefined,
      'c:0': undefined,
    })
    expect(itemTops(columns, 1)).toEqual({ 'd:1': 0, 'e:1': EVENT_HEIGHT })
    expect(segIds(columns[0].hiddenSegs)).toEqual(['b', 'c'])
    expect(columns[1].hiddenSegs).toEqual([])
    expect(columns.map((column) => column.contentHeight))
      .toEqual([EVENT_HEIGHT, EVENT_HEIGHT * 2])
  })

  it('stops mounting candidates beyond the cross-row DOM frontier', () => {
    const columns = layoutRow(twoStacks, 2, true, undefined, { maxDomLevels: 2 })

    // The third level never mounts, yet both columns still list their rejected
    // source, because the popover unions unmounted sources with measured hides.
    expect(itemTops(columns, 0)).toEqual({ 'a:0': 0, 'b:0': EVENT_HEIGHT })
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
    /** Owner-wide monotone more-link reservation. */
    moreLinkHeight?: number,
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

  return buildDayGridSegPlacements(
    plan,
    new Map(plan.mountedSegs.map((source) => [
      source.key,
      config.heights?.[source.key] ?? EVENT_HEIGHT,
    ])),
    computeDayGridMeasuredLimits({
      mode: resolveDayGridPlacementMode(dayMaxEvents, dayMaxEventRows),
      candidateMaxLevels: plan.maxLevels,
      columnCount,
      eventAreaHeight: config.eventAreaHeight,
      moreLinkHeight: config.moreLinkHeight,
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
