import {
  createElement, VNode, Fragment,
  BaseComponent,
  isArraysEqual,
  findElements,
  mapHash,
  RefMap,
  ColProps, CssDimValue, hasShrinkWidth, renderMicroColGroup,
  ScrollGridProps, ScrollGridSectionConfig, ColGroupConfig,
  getScrollGridClassNames, getSectionClassNames, getSectionHasLiquidHeight, getAllowYScrolling, renderChunkContent, computeShrinkWidth,
  getIsRtlScrollbarOnLeft,
  setRef,
  sanitizeShrinkWidth,
  isPropsEqual,
  compareObjs,
  isColPropsEqual,
  getScrollbarWidths,
  memoizeArraylike,
  collectFromHash,
  memoizeHashlike,
  ScrollGridChunkConfig,
  getCanVGrowWithinCell,
  config,
} from '@fullcalendar/common'
import { StickyScrolling } from './StickyScrolling'
import { ClippedScroller, ClippedOverflowValue } from './ClippedScroller'
import { ScrollSyncer } from './ScrollSyncer'

interface ScrollGridState {
  shrinkWidths: number[] // for only one col within each vertical stack of chunks
  forceYScrollbars: boolean // null means not computed yet
  forceXScrollbars: boolean // "
  scrollerClientWidths: { [index: string]: number } // why not use array?
  scrollerClientHeights: { [index: string]: number }
  sectionRowMaxHeights: number[][][]
}

interface ColGroupStat {
  hasShrinkCol: boolean
  totalColWidth: number
  totalColMinWidth: number
  allowXScrolling: boolean
  width?: CssDimValue
  cols: ColProps[]
}

/*
TODO: make <ScrollGridSection> subcomponent
NOTE: doesn't support collapsibleWidth (which is sortof a hack anyway)
*/
export class ScrollGrid extends BaseComponent<ScrollGridProps, ScrollGridState> {
  private compileColGroupStats = memoizeArraylike(compileColGroupStat, isColGroupStatsEqual)
  private renderMicroColGroups = memoizeArraylike(renderMicroColGroup) // yucky to memoize VNodes, but much more efficient for consumers
  private clippedScrollerRefs = new RefMap<ClippedScroller>()

  // doesn't hold non-scrolling els used just for padding
  private scrollerElRefs = new RefMap<HTMLElement>(this._handleScrollerEl.bind(this))

  private chunkElRefs = new RefMap<HTMLTableCellElement>(this._handleChunkEl.bind(this))
  private getStickyScrolling = memoizeArraylike(initStickyScrolling, null, destroyStickyScrolling)
  private getScrollSyncersBySection = memoizeHashlike(initScrollSyncer.bind(this, true), null, destroyScrollSyncer)
  private getScrollSyncersByColumn = memoizeHashlike(initScrollSyncer.bind(this, false), null, destroyScrollSyncer)
  private stickyScrollings: StickyScrolling[] = []
  private scrollSyncersBySection: { [sectionI: string]: ScrollSyncer } = {}
  private scrollSyncersByColumn: { [columnI: string]: ScrollSyncer } = {}

  // for row-height-syncing
  private rowUnstableMap = new Map<HTMLTableRowElement, boolean>() // no need to groom. always self-cancels
  private rowInnerMaxHeightMap = new Map<HTMLTableRowElement, number>()
  private anyRowHeightsChanged = false

  private lastSizingDate: Date
  private recentSizingCnt = 0

  state: ScrollGridState = {
    shrinkWidths: [],
    forceYScrollbars: false,
    forceXScrollbars: false,
    scrollerClientWidths: {},
    scrollerClientHeights: {},
    sectionRowMaxHeights: [],
  }

  render(): VNode {
    let { props, state, context } = this
    let { shrinkWidths } = state

    let colGroupStats = this.compileColGroupStats(props.colGroups.map((colGroup) => [colGroup]))
    let microColGroupNodes = this.renderMicroColGroups(colGroupStats.map((stat, i) => [stat.cols, shrinkWidths[i]]))
    let classNames = getScrollGridClassNames(props.liquid, context)

    // yuck
    let indices: [ number, number ][] = []
    let [sectionCnt, chunksPerSection] = this.getDims()
    for (let sectionI = 0; sectionI < sectionCnt; sectionI += 1) {
      for (let chunkI = 0; chunkI < chunksPerSection; chunkI += 1) {
        indices.push([sectionI, chunkI])
      }
    }

    // TODO: make DRY
    let sectionConfigs = props.sections
    let configCnt = sectionConfigs.length
    let configI = 0
    let currentConfig: ScrollGridSectionConfig
    let headSectionNodes: VNode[] = []
    let bodySectionNodes: VNode[] = []
    let footSectionNodes: VNode[] = []

    while (configI < configCnt && (currentConfig = sectionConfigs[configI]).type === 'header') {
      headSectionNodes.push(this.renderSection(
        currentConfig,
        configI,
        colGroupStats,
        microColGroupNodes,
        state.sectionRowMaxHeights,
        true,
      ))
      configI += 1
    }

    while (configI < configCnt && (currentConfig = sectionConfigs[configI]).type === 'body') {
      bodySectionNodes.push(this.renderSection(
        currentConfig,
        configI,
        colGroupStats,
        microColGroupNodes,
        state.sectionRowMaxHeights,
        false,
      ))
      configI += 1
    }

    while (configI < configCnt && (currentConfig = sectionConfigs[configI]).type === 'footer') {
      footSectionNodes.push(this.renderSection(
        currentConfig,
        configI,
        colGroupStats,
        microColGroupNodes,
        state.sectionRowMaxHeights,
        true,
      ))
      configI += 1
    }

    const isBuggy = !getCanVGrowWithinCell() // see NOTE in SimpleScrollGrid
    const roleAttrs = { role: 'rowgroup' }

    return createElement(
      'table',
      {
        ref: props.elRef,
        role: 'grid',
        className: classNames.join(' '),
      },
      renderMacroColGroup(colGroupStats, shrinkWidths),
      Boolean(!isBuggy && headSectionNodes.length) && createElement('thead', roleAttrs, ...headSectionNodes),
      Boolean(!isBuggy && bodySectionNodes.length) && createElement('tbody', roleAttrs, ...bodySectionNodes),
      Boolean(!isBuggy && footSectionNodes.length) && createElement('tfoot', roleAttrs, ...footSectionNodes),
      isBuggy && createElement('tbody', roleAttrs, ...headSectionNodes, ...bodySectionNodes, ...footSectionNodes),
    )
  }

  renderSection(
    sectionConfig: ScrollGridSectionConfig,
    sectionIndex: number,
    colGroupStats: ColGroupStat[],
    microColGroupNodes: VNode[],
    sectionRowMaxHeights: number[][][],
    isHeader: boolean,
  ): VNode {
    if ('outerContent' in sectionConfig) {
      return (
        <Fragment key={sectionConfig.key}>
          {sectionConfig.outerContent}
        </Fragment>
      )
    }

    return (
      <tr
        key={sectionConfig.key}
        role="presentation"
        className={getSectionClassNames(sectionConfig, this.props.liquid).join(' ')}
      >
        {sectionConfig.chunks.map((chunkConfig, i) => this.renderChunk(
          sectionConfig,
          sectionIndex,
          colGroupStats[i],
          microColGroupNodes[i],
          chunkConfig,
          i,
          (sectionRowMaxHeights[sectionIndex] || [])[i] || [],
          isHeader,
        ))}
      </tr>
    )
  }

  renderChunk(
    sectionConfig: ScrollGridSectionConfig,
    sectionIndex: number,
    colGroupStat: ColGroupStat | undefined,
    microColGroupNode: VNode | undefined,
    chunkConfig: ScrollGridChunkConfig,
    chunkIndex: number,
    rowHeights: number[],
    isHeader: boolean,
  ): VNode {
    if ('outerContent' in chunkConfig) {
      return (
        <Fragment key={chunkConfig.key}>
          {chunkConfig.outerContent}
        </Fragment>
      )
    }

    let { state } = this
    let { scrollerClientWidths, scrollerClientHeights } = state

    let [sectionCnt, chunksPerSection] = this.getDims()
    let index = sectionIndex * chunksPerSection + chunkIndex
    let sideScrollIndex = (!this.context.isRtl || getIsRtlScrollbarOnLeft()) ? chunksPerSection - 1 : 0
    let isVScrollSide = chunkIndex === sideScrollIndex
    let isLastSection = sectionIndex === sectionCnt - 1

    let forceXScrollbars = isLastSection && state.forceXScrollbars // NOOOO can result in `null`
    let forceYScrollbars = isVScrollSide && state.forceYScrollbars // NOOOO can result in `null`

    let allowXScrolling = colGroupStat && colGroupStat.allowXScrolling // rename?
    let allowYScrolling = getAllowYScrolling(this.props, sectionConfig) // rename? do in section func?

    let chunkVGrow = getSectionHasLiquidHeight(this.props, sectionConfig) // do in section func?
    let expandRows = sectionConfig.expandRows && chunkVGrow
    let tableMinWidth = (colGroupStat && colGroupStat.totalColMinWidth) || ''

    let content = renderChunkContent(sectionConfig, chunkConfig, {
      tableColGroupNode: microColGroupNode,
      tableMinWidth,
      clientWidth: scrollerClientWidths[index] !== undefined ? scrollerClientWidths[index] : null,
      clientHeight: scrollerClientHeights[index] !== undefined ? scrollerClientHeights[index] : null,
      expandRows,
      syncRowHeights: Boolean(sectionConfig.syncRowHeights),
      rowSyncHeights: rowHeights,
      reportRowHeightChange: this.handleRowHeightChange,
    }, isHeader)

    let overflowX: ClippedOverflowValue =
      forceXScrollbars ? (isLastSection ? 'scroll' : 'scroll-hidden') :
        !allowXScrolling ? 'hidden' :
          (isLastSection ? 'auto' : 'scroll-hidden')

    let overflowY: ClippedOverflowValue =
      forceYScrollbars ? (isVScrollSide ? 'scroll' : 'scroll-hidden') :
        !allowYScrolling ? 'hidden' :
          (isVScrollSide ? 'auto' : 'scroll-hidden')

    // it *could* be possible to reduce DOM wrappers by only doing a ClippedScroller when allowXScrolling or allowYScrolling,
    // but if these values were to change, the inner components would be unmounted/remounted because of the parent change.
    content = (
      <ClippedScroller
        ref={this.clippedScrollerRefs.createRef(index)}
        scrollerElRef={this.scrollerElRefs.createRef(index)}
        overflowX={overflowX}
        overflowY={overflowY}
        liquid={chunkVGrow}
        maxHeight={sectionConfig.maxHeight}
      >
        {content}
      </ClippedScroller>
    )

    return createElement(
      isHeader ? 'th' : 'td',
      {
        key: chunkConfig.key,
        ref: this.chunkElRefs.createRef(index) as any,
        role: 'presentation',
      },
      content,
    )
  }

  componentDidMount() {
    this.updateScrollSyncers()
    this.handleSizing(false)

    this.context.addResizeHandler(this.handleSizing)
  }

  componentDidUpdate(prevProps: ScrollGridProps, prevState: ScrollGridState) {
    this.updateScrollSyncers()

    // TODO: need better solution when state contains non-sizing things
    this.handleSizing(false, prevState.sectionRowMaxHeights !== this.state.sectionRowMaxHeights)
  }

  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)

    this.destroyStickyScrolling()
    this.destroyScrollSyncers()
  }

  handleSizing = (isForcedResize: boolean, sectionRowMaxHeightsChanged?: boolean) => {
    if (!this.allowSizing()) {
      return
    }

    if (!sectionRowMaxHeightsChanged) { // something else changed, probably external
      this.anyRowHeightsChanged = true
    }

    let otherState: Partial<ScrollGridState> = {}

    // if reacting to self-change of sectionRowMaxHeightsChanged, or not stable, don't do anything
    if (isForcedResize || (!sectionRowMaxHeightsChanged && !this.rowUnstableMap.size)) {
      otherState.sectionRowMaxHeights = this.computeSectionRowMaxHeights()
    }

    this.setState({
      shrinkWidths: this.computeShrinkWidths(),
      ...this.computeScrollerDims(),
      ...(otherState as any), // wtf
    }, () => {
      if (!this.rowUnstableMap.size) {
        this.updateStickyScrolling() // needs to happen AFTER final positioning committed to DOM
      }
    })
  }

  allowSizing() {
    let now = new Date()

    if (
      !this.lastSizingDate ||
      now.valueOf() > this.lastSizingDate.valueOf() + config.SCROLLGRID_RESIZE_INTERVAL
    ) {
      this.lastSizingDate = now
      this.recentSizingCnt = 0
      return true
    }

    return (this.recentSizingCnt += 1) <= 10
  }

  handleRowHeightChange = (rowEl: HTMLTableRowElement, isStable: boolean) => {
    let { rowUnstableMap, rowInnerMaxHeightMap } = this

    if (!isStable) {
      rowUnstableMap.set(rowEl, true)
    } else {
      rowUnstableMap.delete(rowEl)

      let innerMaxHeight = getRowInnerMaxHeight(rowEl)
      if (!rowInnerMaxHeightMap.has(rowEl) || rowInnerMaxHeightMap.get(rowEl) !== innerMaxHeight) {
        rowInnerMaxHeightMap.set(rowEl, innerMaxHeight)
        this.anyRowHeightsChanged = true
      }

      if (!rowUnstableMap.size && this.anyRowHeightsChanged) {
        this.anyRowHeightsChanged = false
        this.setState({
          sectionRowMaxHeights: this.computeSectionRowMaxHeights(),
        })
      }
    }
  }

  computeShrinkWidths() {
    let colGroupStats = this.compileColGroupStats(this.props.colGroups.map((colGroup) => [colGroup]))
    let [sectionCnt, chunksPerSection] = this.getDims()
    let cnt = sectionCnt * chunksPerSection
    let shrinkWidths: number[] = []

    colGroupStats.forEach((colGroupStat, i) => {
      if (colGroupStat.hasShrinkCol) {
        let chunkEls = this.chunkElRefs.collect(i, cnt, chunksPerSection) // in one col
        shrinkWidths[i] = computeShrinkWidth(chunkEls)
      }
    })

    return shrinkWidths
  }

  // has the side effect of grooming rowInnerMaxHeightMap
  // TODO: somehow short-circuit if there are no new height changes
  private computeSectionRowMaxHeights() {
    let newHeightMap = new Map<HTMLTableRowElement, number>()

    let [sectionCnt, chunksPerSection] = this.getDims()
    let sectionRowMaxHeights: number[][][] = []

    for (let sectionI = 0; sectionI < sectionCnt; sectionI += 1) {
      let sectionConfig = this.props.sections[sectionI]
      let assignableHeights: number[][] = [] // chunk, row

      if (sectionConfig && sectionConfig.syncRowHeights) {
        let rowHeightsByChunk: number[][] = []

        for (let chunkI = 0; chunkI < chunksPerSection; chunkI += 1) {
          let index = sectionI * chunksPerSection + chunkI
          let rowHeights: number[] = []

          let chunkEl = this.chunkElRefs.currentMap[index]
          if (chunkEl) {
            rowHeights = findElements(chunkEl, '.fc-scrollgrid-sync-table tr').map((rowEl: HTMLTableRowElement) => {
              let max = getRowInnerMaxHeight(rowEl)
              newHeightMap.set(rowEl, max)
              return max
            })
          } else {
            rowHeights = []
          }

          rowHeightsByChunk.push(rowHeights)
        }

        let rowCnt = rowHeightsByChunk[0].length
        let isEqualRowCnt = true

        for (let chunkI = 1; chunkI < chunksPerSection; chunkI += 1) {
          let isOuterContent = sectionConfig.chunks[chunkI] && sectionConfig.chunks[chunkI].outerContent !== undefined // can be null

          if (!isOuterContent && rowHeightsByChunk[chunkI].length !== rowCnt) { // skip outer content
            isEqualRowCnt = false
            break
          }
        }

        if (!isEqualRowCnt) {
          let chunkHeightSums: number[] = []
          for (let chunkI = 0; chunkI < chunksPerSection; chunkI += 1) {
            chunkHeightSums.push(
              sumNumbers(rowHeightsByChunk[chunkI]) + rowHeightsByChunk[chunkI].length, // add in border
            )
          }

          let maxTotalSum = Math.max(...chunkHeightSums)

          for (let chunkI = 0; chunkI < chunksPerSection; chunkI += 1) {
            let rowInChunkCnt = rowHeightsByChunk[chunkI].length
            let rowInChunkTotalHeight = maxTotalSum - rowInChunkCnt // subtract border

            // height of non-first row. we do this to avoid rounding, because it's unreliable within a table
            let rowInChunkHeightOthers = Math.floor(rowInChunkTotalHeight / rowInChunkCnt)

            // whatever is leftover goes to the first row
            let rowInChunkHeightFirst = rowInChunkTotalHeight - rowInChunkHeightOthers * (rowInChunkCnt - 1)

            let rowInChunkHeights: number[] = []
            let row = 0

            if (row < rowInChunkCnt) {
              rowInChunkHeights.push(rowInChunkHeightFirst)
              row += 1
            }

            while (row < rowInChunkCnt) {
              rowInChunkHeights.push(rowInChunkHeightOthers)
              row += 1
            }

            assignableHeights.push(rowInChunkHeights)
          }
        } else {
          for (let chunkI = 0; chunkI < chunksPerSection; chunkI += 1) {
            assignableHeights.push([])
          }

          for (let row = 0; row < rowCnt; row += 1) {
            let rowHeightsAcrossChunks: number[] = []

            for (let chunkI = 0; chunkI < chunksPerSection; chunkI += 1) {
              let h = rowHeightsByChunk[chunkI][row]
              if (h != null) { // protect against outerContent
                rowHeightsAcrossChunks.push(h)
              }
            }

            let maxHeight = Math.max(...rowHeightsAcrossChunks)

            for (let chunkI = 0; chunkI < chunksPerSection; chunkI += 1) {
              assignableHeights[chunkI].push(maxHeight)
            }
          }
        }
      }

      sectionRowMaxHeights.push(assignableHeights)
    }

    this.rowInnerMaxHeightMap = newHeightMap

    return sectionRowMaxHeights
  }

  computeScrollerDims() {
    let scrollbarWidth = getScrollbarWidths()
    let [sectionCnt, chunksPerSection] = this.getDims()
    let sideScrollI = (!this.context.isRtl || getIsRtlScrollbarOnLeft()) ? chunksPerSection - 1 : 0
    let lastSectionI = sectionCnt - 1
    let currentScrollers = this.clippedScrollerRefs.currentMap
    let scrollerEls = this.scrollerElRefs.currentMap
    let forceYScrollbars = false
    let forceXScrollbars = false
    let scrollerClientWidths: { [index: string]: number } = {}
    let scrollerClientHeights: { [index: string]: number } = {}

    for (let sectionI = 0; sectionI < sectionCnt; sectionI += 1) { // along edge
      let index = sectionI * chunksPerSection + sideScrollI
      let scroller = currentScrollers[index]

      if (scroller && scroller.needsYScrolling()) {
        forceYScrollbars = true
        break
      }
    }

    for (let chunkI = 0; chunkI < chunksPerSection; chunkI += 1) { // along last row
      let index = lastSectionI * chunksPerSection + chunkI
      let scroller = currentScrollers[index]

      if (scroller && scroller.needsXScrolling()) {
        forceXScrollbars = true
        break
      }
    }

    for (let sectionI = 0; sectionI < sectionCnt; sectionI += 1) {
      for (let chunkI = 0; chunkI < chunksPerSection; chunkI += 1) {
        let index = sectionI * chunksPerSection + chunkI
        let scrollerEl = scrollerEls[index]

        if (scrollerEl) {
          // TODO: weird way to get this. need harness b/c doesn't include table borders
          let harnessEl = scrollerEl.parentNode as HTMLElement

          scrollerClientWidths[index] = Math.floor(
            harnessEl.getBoundingClientRect().width - (
              (chunkI === sideScrollI && forceYScrollbars)
                ? scrollbarWidth.y // use global because scroller might not have scrollbars yet but will need them in future
                : 0
            ),
          )

          scrollerClientHeights[index] = Math.floor(
            harnessEl.getBoundingClientRect().height - (
              (sectionI === lastSectionI && forceXScrollbars)
                ? scrollbarWidth.x // use global because scroller might not have scrollbars yet but will need them in future
                : 0
            ),
          )
        }
      }
    }

    return { forceYScrollbars, forceXScrollbars, scrollerClientWidths, scrollerClientHeights }
  }

  updateStickyScrolling() {
    let { isRtl } = this.context
    let argsByKey = this.scrollerElRefs.getAll().map(
      (scrollEl) => [scrollEl, isRtl] as [ HTMLElement, boolean ],
    )

    let stickyScrollings = this.getStickyScrolling(argsByKey)

    stickyScrollings.forEach((stickyScrolling) => stickyScrolling.updateSize())

    this.stickyScrollings = stickyScrollings
  }

  destroyStickyScrolling() {
    this.stickyScrollings.forEach(destroyStickyScrolling)
  }

  updateScrollSyncers() {
    let [sectionCnt, chunksPerSection] = this.getDims()
    let cnt = sectionCnt * chunksPerSection
    let scrollElsBySection: { [sectionI: string]: HTMLElement[] } = {}
    let scrollElsByColumn: { [colI: string]: HTMLElement[] } = {}
    let scrollElMap = this.scrollerElRefs.currentMap

    for (let sectionI = 0; sectionI < sectionCnt; sectionI += 1) {
      let startIndex = sectionI * chunksPerSection
      let endIndex = startIndex + chunksPerSection

      scrollElsBySection[sectionI] = collectFromHash(scrollElMap, startIndex, endIndex, 1) // use the filtered
    }

    for (let col = 0; col < chunksPerSection; col += 1) {
      scrollElsByColumn[col] = this.scrollerElRefs.collect(col, cnt, chunksPerSection) // DON'T use the filtered
    }

    this.scrollSyncersBySection = this.getScrollSyncersBySection(scrollElsBySection)
    this.scrollSyncersByColumn = this.getScrollSyncersByColumn(scrollElsByColumn)
  }

  destroyScrollSyncers() {
    mapHash(this.scrollSyncersBySection, destroyScrollSyncer)
    mapHash(this.scrollSyncersByColumn, destroyScrollSyncer)
  }

  getChunkConfigByIndex(index: number) { // somewhat expensive for something so simple
    let chunksPerSection = this.getDims()[1]
    let sectionI = Math.floor(index / chunksPerSection)
    let chunkI = index % chunksPerSection
    let sectionConfig = this.props.sections[sectionI]

    return sectionConfig && sectionConfig.chunks[chunkI]
  }

  forceScrollLeft(col: number, scrollLeft: number) {
    let scrollSyncer = this.scrollSyncersByColumn[col]

    if (scrollSyncer) {
      scrollSyncer.forceScrollLeft(scrollLeft)
    }
  }

  forceScrollTop(sectionI: number, scrollTop: number) {
    let scrollSyncer = this.scrollSyncersBySection[sectionI]

    if (scrollSyncer) {
      scrollSyncer.forceScrollTop(scrollTop)
    }
  }

  _handleChunkEl(chunkEl: HTMLTableCellElement | null, key: string) {
    let chunkConfig = this.getChunkConfigByIndex(parseInt(key, 10))

    if (chunkConfig) { // null if section disappeared. bad, b/c won't null-set the elRef
      setRef(chunkConfig.elRef, chunkEl)
    }
  }

  _handleScrollerEl(scrollerEl: HTMLElement | null, key: string) {
    let chunkConfig = this.getChunkConfigByIndex(parseInt(key, 10))

    if (chunkConfig) { // null if section disappeared. bad, b/c won't null-set the elRef
      setRef(chunkConfig.scrollerElRef, scrollerEl)
    }
  }

  getDims() {
    let sectionCnt = this.props.sections.length
    let chunksPerSection = sectionCnt ? this.props.sections[0].chunks.length : 0

    return [sectionCnt, chunksPerSection]
  }
}

ScrollGrid.addStateEquality({
  shrinkWidths: isArraysEqual,
  scrollerClientWidths: isPropsEqual,
  scrollerClientHeights: isPropsEqual,
})

function sumNumbers(numbers: number[]) { // TODO: general util
  let sum = 0

  for (let n of numbers) {
    sum += n
  }

  return sum
}

function getRowInnerMaxHeight(rowEl: HTMLElement) {
  let innerHeights = findElements(rowEl, '.fc-scrollgrid-sync-inner').map(getElHeight)

  if (innerHeights.length) {
    return Math.max(...innerHeights)
  }

  return 0
}

function getElHeight(el: HTMLElement) {
  return el.offsetHeight // better to deal with integers, for rounding, for PureComponent
}

function renderMacroColGroup(colGroupStats: ColGroupStat[], shrinkWidths: number[]) {
  let children = colGroupStats.map((colGroupStat, i) => {
    let width = colGroupStat.width

    if (width === 'shrink') {
      width = colGroupStat.totalColWidth + sanitizeShrinkWidth(shrinkWidths[i]) + 1 // +1 for border :(
    }

    return ( // eslint-disable-next-line react/jsx-key
      <col style={{ width }} />
    )
  })

  return createElement('colgroup', {}, ...children)
}

function compileColGroupStat(colGroupConfig: ColGroupConfig): ColGroupStat {
  let totalColWidth = sumColProp(colGroupConfig.cols, 'width') // excludes "shrink"
  let totalColMinWidth = sumColProp(colGroupConfig.cols, 'minWidth')
  let hasShrinkCol = hasShrinkWidth(colGroupConfig.cols)
  let allowXScrolling = colGroupConfig.width !== 'shrink' && Boolean(totalColWidth || totalColMinWidth || hasShrinkCol)

  return {
    hasShrinkCol,
    totalColWidth,
    totalColMinWidth,
    allowXScrolling,
    cols: colGroupConfig.cols,
    width: colGroupConfig.width,
  }
}

function sumColProp(cols: ColProps[], propName: string) {
  let total = 0

  for (let col of cols) {
    let val = col[propName]

    if (typeof val === 'number') {
      total += val * (col.span || 1)
    }
  }

  return total
}

const COL_GROUP_STAT_EQUALITY = {
  cols: isColPropsEqual,
}

function isColGroupStatsEqual(stat0: ColGroupStat, stat1: ColGroupStat): boolean {
  return compareObjs(stat0, stat1, COL_GROUP_STAT_EQUALITY)
}

// for memoizers...

function initScrollSyncer(isVertical: boolean, ...scrollEls: HTMLElement[]) {
  return new ScrollSyncer(isVertical, scrollEls)
}

function destroyScrollSyncer(scrollSyncer: ScrollSyncer) {
  scrollSyncer.destroy()
}

function initStickyScrolling(scrollEl: HTMLElement, isRtl: boolean) {
  return new StickyScrolling(scrollEl, isRtl)
}

function destroyStickyScrolling(stickyScrolling: StickyScrolling) {
  stickyScrolling.destroy()
}
