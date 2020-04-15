import {
  h, VNode, createRef, Fragment, render,
  BaseComponent,
  isArraysEqual,
  findElements,
  ComponentContext,
  mapHash,
  RefMap,
  ColProps, ChunkConfig, CssDimValue, hasShrinkWidth, renderMicroColGroup,
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
  memoizeHashlike
} from '@fullcalendar/core'
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


export class ScrollGrid extends BaseComponent<ScrollGridProps, ScrollGridState> { // TODO: make <ScrollGridSection> subcomponent

  private compileColGroupStats = memoizeArraylike(compileColGroupStat, isColGroupStatsEqual)
  private renderMicroColGroups = memoizeArraylike(renderMicroColGroup) // yucky to memoize VNodes, but much more efficient for consumers
  private printContainerRef = createRef<HTMLDivElement>()
  private clippedScrollerRefs = new RefMap<ClippedScroller>()
  private scrollerElRefs = new RefMap<HTMLElement>(this._handleScrollerEl.bind(this)) // doesn't hold non-scrolling els used just for padding
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


  state: ScrollGridState = {
    shrinkWidths: [],
    forceYScrollbars: false,
    forceXScrollbars: false,
    scrollerClientWidths: {},
    scrollerClientHeights: {},
    sectionRowMaxHeights: []
  }


  render(props: ScrollGridProps, state: ScrollGridState, context: ComponentContext) {
    let { shrinkWidths } = state

    let colGroupStats = this.compileColGroupStats(props.colGroups.map((colGroup) => [ colGroup ]))
    let microColGroupNodes = this.renderMicroColGroups(colGroupStats.map((stat, i) => [ stat.cols, shrinkWidths[i] ]))
    let classNames = getScrollGridClassNames(props.liquid, context)

    // yuck
    let indices: [ number, number ][] = []
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    for (let sectionI = 0; sectionI < sectionCnt; sectionI++) {
      for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) {
        indices.push([ sectionI, chunkI ])
      }
    }

    return (
      <Fragment>
        <table class={classNames.join(' ')} style={{ display: props.forPrint ? 'none' : '' }}>
          <colgroup>
            {colGroupStats.map((colGroupStat, i) => renderMacroCol(colGroupStat, shrinkWidths[i]))}
          </colgroup>
          <tbody>
            {props.sections.map((sectionConfig, i) => this.renderSection(sectionConfig, i, colGroupStats, microColGroupNodes, state.sectionRowMaxHeights))}
          </tbody>
        </table>
        {props.forPrint &&
          <div ref={this.printContainerRef}></div>
        }
      </Fragment>
    )
  }


  renderSection(
    sectionConfig: ScrollGridSectionConfig,
    sectionIndex: number,
    colGroupStats: ColGroupStat[],
    microColGroupNodes: VNode[],
    sectionRowMaxHeights: number[][][]
  ): VNode {

    if ('outerContent' in sectionConfig) {
      return sectionConfig.outerContent
    }

    return (
      <tr key={sectionConfig.key} class={getSectionClassNames(sectionConfig, this.props.liquid).join(' ')}>
        {sectionConfig.chunks.map((chunkConfig, i) => {
          return this.renderChunk(
            sectionConfig,
            sectionIndex,
            colGroupStats[i],
            microColGroupNodes[i],
            chunkConfig,
            i,
            (sectionRowMaxHeights[sectionIndex] || [])[i] || []
          )
        })}
      </tr>
    )
  }


  renderChunk(
    sectionConfig: ScrollGridSectionConfig,
    sectionIndex: number,
    colGroupStat: ColGroupStat | undefined,
    microColGroupNode: VNode | undefined,
    chunkConfig: ChunkConfig,
    chunkIndex: number,
    rowHeights: number[]
  ): VNode {

    if ('outerContent' in chunkConfig) {
      return chunkConfig.outerContent
    }

    let { state } = this
    let { scrollerClientWidths, scrollerClientHeights } = state

    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let index = sectionIndex * chunksPerSection + chunkIndex
    let sideScrollIndex = (!this.context.isRtl || getIsRtlScrollbarOnLeft()) ? chunksPerSection - 1 : 0
    let isVScrollSide = chunkIndex === sideScrollIndex
    let isLastSection = sectionIndex === sectionCnt - 1

    let forceXScrollbars = isLastSection && state.forceXScrollbars // NOOOO can result in `null`
    let forceYScrollbars = isVScrollSide && state.forceYScrollbars // NOOOO can result in `null`

    let allowXScrolling = colGroupStat && colGroupStat.allowXScrolling // rename?
    let allowYScrolling = getAllowYScrolling(this.props, sectionConfig) // rename? do in section func?

    let chunkVGrow = getSectionHasLiquidHeight(this.props, sectionConfig) // do in section func?
    let expandRows = sectionConfig.expandRows
    let tableMinWidth = (colGroupStat && colGroupStat.totalColMinWidth) || ''

    if (expandRows && !chunkVGrow) {
      throw new Error('invalid use of expandRows')
    }

    let content = renderChunkContent(sectionConfig, chunkConfig, {
      tableColGroupNode: microColGroupNode,
      tableMinWidth,
      clientWidth: scrollerClientWidths[index] !== undefined ? scrollerClientWidths[index] : null,
      clientHeight: scrollerClientHeights[index] !== undefined ? scrollerClientHeights[index] : null,
      expandRows,
      syncRowHeights: Boolean(sectionConfig.syncRowHeights),
      rowSyncHeights: rowHeights,
      reportRowHeightChange: this.handleRowHeightChange
    })

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
      >{content}</ClippedScroller>
    )

    return (
      <td ref={this.chunkElRefs.createRef(index)}>
        {content}
      </td>
    )
  }


  componentDidMount() {
    this.updateScrollSyncers()

    if (this.props.forPrint) {
      this.fillPrintContainer()
    } else {
      this.handleSizing()
    }

    this.context.addResizeHandler(this.handleSizing)
  }


  componentDidUpdate(prevProps: ScrollGridProps, prevState: ScrollGridState) {
    this.updateScrollSyncers()

    if (this.props.forPrint) {
      this.fillPrintContainer()
    } else {
      // TODO: need better solution when state contains non-sizing things
      this.handleSizing(prevState.sectionRowMaxHeights !== this.state.sectionRowMaxHeights)
    }
  }


  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)

    this.destroyStickyScrolling()
    this.destroyScrollSyncers()
  }


  handleSizing = (sectionRowMaxHeightsChanged?: boolean) => {

    if (!sectionRowMaxHeightsChanged) { // something else changed, probably external
      this.anyRowHeightsChanged = true
    }

    this.setState({
      shrinkWidths: this.computeShrinkWidths(),
      ...this.computeScrollerDims(),
      ...(
        // if reacting to self-change of sectionRowMaxHeightsChanged, or not stable, don't do anything
        (sectionRowMaxHeightsChanged || this.rowUnstableMap.size) ? {} : {
          sectionRowMaxHeights: this.computeSectionRowMaxHeights()
        }
      )
    }, () => {
      if (!this.rowUnstableMap.size) {
        this.updateStickyScrolling() // needs to happen AFTER final positioning committed to DOM
      }
    })
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
          sectionRowMaxHeights: this.computeSectionRowMaxHeights()
        })
      }
    }
  }


  computeShrinkWidths() {
    let colGroupStats = this.compileColGroupStats(this.props.colGroups.map((colGroup) => [ colGroup ]))
    let [ sectionCnt, chunksPerSection ] = this.getDims()
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
    let oldHeightMap = this.rowInnerMaxHeightMap
    let newHeightMap = new Map<HTMLTableRowElement, number>()

    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let sectionRowMaxHeights: number[][][] = []

    for (let sectionI = 0; sectionI < sectionCnt; sectionI++) {
      let sectionConfig = this.props.sections[sectionI] || {}
      let assignableHeights: number[][] = [] // chunk, row

      if (sectionConfig.syncRowHeights) {
        let rowHeightsByChunk: number[][] = []

        for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) {
          let index = sectionI * chunksPerSection + chunkI
          let rowHeights: number[] = []

          let chunkEl = this.chunkElRefs.currentMap[index]
          if (chunkEl) {
            rowHeights = findElements(chunkEl, '.fc-scrollgrid-sync-table tr').map(function(rowEl: HTMLTableRowElement) {
              let max = oldHeightMap.get(rowEl)
              if (max == null) {
                max = getRowInnerMaxHeight(rowEl)
              }
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

        for (let chunkI = 1; chunkI < chunksPerSection; chunkI++) {
          let isOuterContent = sectionConfig.chunks[chunkI] && sectionConfig.chunks[chunkI].outerContent !== undefined // can be null

          if (!isOuterContent && rowHeightsByChunk[chunkI].length !== rowCnt) { // skip outer content
            isEqualRowCnt = false
            break
          }
        }

        if (!isEqualRowCnt) {

          let chunkHeightSums: number[] = []
          for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) {
            chunkHeightSums.push(
              sumNumbers(rowHeightsByChunk[chunkI]) + rowHeightsByChunk[chunkI].length // add in border
            )
          }

          let maxTotalSum = Math.max(...chunkHeightSums)

          for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) {
            let rowInChunkCnt = rowHeightsByChunk[chunkI].length
            let rowInChunkHeight = (maxTotalSum - rowInChunkCnt) / rowInChunkCnt // subtract border
            let rowInChunkHeights: number[] = []

            for (let row = 0; row < rowInChunkCnt; row++) {
              rowInChunkHeights.push(rowInChunkHeight)
            }

            assignableHeights.push(rowInChunkHeights)
          }

        } else {

          for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) {
            assignableHeights.push([])
          }

          for (let row = 0; row < rowCnt; row++) {
            let rowHeightsAcrossChunks: number[] = []

            for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) {
              let h = rowHeightsByChunk[chunkI][row]
              if (h != null) { // protect against outerContent
                rowHeightsAcrossChunks.push(h)
              }
            }

            let maxHeight = Math.max(...rowHeightsAcrossChunks)

            for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) {
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
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let sideScrollI = (!this.context.isRtl || getIsRtlScrollbarOnLeft()) ? chunksPerSection - 1 : 0
    let lastSectionI = sectionCnt - 1
    let currentScrollers = this.clippedScrollerRefs.currentMap
    let scrollerEls = this.scrollerElRefs.currentMap
    let forceYScrollbars = false
    let forceXScrollbars = false
    let scrollerClientWidths: { [index: string]: number } = {}
    let scrollerClientHeights: { [index: string]: number } = {}

    for (let sectionI = 0; sectionI < sectionCnt; sectionI++) { // along edge
      let index = sectionI * chunksPerSection + sideScrollI
      let scroller = currentScrollers[index]

      if (scroller && scroller.needsYScrolling()) {
        forceYScrollbars = true
        break
      }
    }

    for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) { // along last row
      let index = lastSectionI * chunksPerSection + chunkI
      let scroller = currentScrollers[index]

      if (scroller && scroller.needsXScrolling()) {
        forceXScrollbars = true
        break
      }
    }

    for (let sectionI = 0; sectionI < sectionCnt; sectionI++) {
      for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) {
        let index = sectionI * chunksPerSection + chunkI
        let scrollerEl = scrollerEls[index]

        if (scrollerEl) {
          let harnessEl = scrollerEl.parentNode as HTMLElement // TODO: weird way to get this. need harness b/c doesn't include table borders

          scrollerClientWidths[index] = Math.floor(
            harnessEl.getBoundingClientRect().width - (
              (chunkI === sideScrollI && forceYScrollbars)
                ? scrollbarWidth.y // use global because scroller might not have scrollbars yet but will need them in future
                : 0
            )
          )

          scrollerClientHeights[index] = Math.floor(
            harnessEl.getBoundingClientRect().height - (
              (sectionI === lastSectionI && forceXScrollbars)
                ? scrollbarWidth.x // use global because scroller might not have scrollbars yet but will need them in future
                : 0
              )
          )
        }
      }
    }

    return { forceYScrollbars, forceXScrollbars, scrollerClientWidths, scrollerClientHeights }
  }


  updateStickyScrolling() {
    let { isRtl } = this.context
    let argsByKey = this.scrollerElRefs.getAll().map(
      (scrollEl) => [ scrollEl, isRtl ] as [ HTMLElement, boolean ]
    )

    let stickyScrollings = this.getStickyScrolling(argsByKey)

    for (let key in stickyScrollings) {
      stickyScrollings[key].updateSize()
    }

    this.stickyScrollings = stickyScrollings
  }


  destroyStickyScrolling() {
    this.stickyScrollings.forEach(destroyStickyScrolling)
  }


  updateScrollSyncers() {
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let cnt = sectionCnt * chunksPerSection
    let scrollElsBySection: { [sectionI: string]: HTMLElement[] } = {}
    let scrollElsByColumn: { [colI: string]: HTMLElement[] } = {}
    let scrollElMap = this.scrollerElRefs.currentMap

    for (let sectionI = 0; sectionI < sectionCnt; sectionI++) {
      let startIndex = sectionI * chunksPerSection
      let endIndex = startIndex + chunksPerSection

      scrollElsBySection[sectionI] = collectFromHash(scrollElMap, startIndex, endIndex, 1) // use the filtered
    }

    for (let col = 0; col < chunksPerSection; col++) {

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

    return this.props.sections[sectionI].chunks[chunkI]
  }


  fillPrintContainer() {
    render( // TODO: change CSS to be layout:normal
      <table ref={this.handlePrintTableEl} class='fc-scrollgrid'>
        <colgroup>{renderPrintCols(this.props.colGroups)}</colgroup>
      </table>,
      this.printContainerRef.current
    )
  }


  handlePrintTableEl = (el: HTMLTableElement | null) => {
    if (el) {
      renderPrintTrs(this.props.sections, this.chunkElRefs, el)
    }
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

    setRef(chunkConfig.elRef, chunkEl)
  }


  _handleScrollerEl(scrollerEl: HTMLElement | null, key: string) {
    let chunkConfig = this.getChunkConfigByIndex(parseInt(key, 10))

    setRef(chunkConfig.scrollerElRef, scrollerEl)
  }


  getDims() {
    let sectionCnt = this.props.sections.length
    let chunksPerSection = sectionCnt ? this.props.sections[0].chunks.length : 0

    return [ sectionCnt, chunksPerSection ]
  }

}

ScrollGrid.addStateEquality({
  shrinkWidths: isArraysEqual,
  scrollerClientWidths: isPropsEqual,
  scrollerClientHeights: isPropsEqual
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


function renderPrintCols(colGroups: ColGroupConfig[]) {
  let colVNodes: VNode[] = []

  for (let colGroup of colGroups) {
    for (let colProps of colGroup.cols) {
      colVNodes.push(
        <col
          span={colProps.span}
          style={{
            width: colProps.width === 'shrink' ? 0 : colProps.width || '',
            minWidth: colProps.minWidth || ''
          }}
        />
      )
    }
  }

  return colVNodes
}


function renderPrintTrs(sectionConfigs: ScrollGridSectionConfig[], chunkElRefs: RefMap<HTMLElement>, tableEl: HTMLElement) {

  for (let sectionI = 0; sectionI < sectionConfigs.length; sectionI++) {
    let sectionConfig = sectionConfigs[sectionI]

    let trSets: HTMLElement[][] = []
    let chunksPerSection = sectionConfig.chunks.length
    let sectionStart = sectionI * chunksPerSection
    let sectionEnd = sectionStart + chunksPerSection
    let chunkEls = chunkElRefs.collect(sectionStart, sectionEnd)

    let tableBodyEl = document.createElement('t' + sectionConfig.type)
    tableBodyEl.className = sectionConfig.className || ''
    tableEl.appendChild(tableBodyEl)

    for (let chunkEl of chunkEls) {
      trSets.push(findElements(chunkEl, 'tr'))
    }

    if (trSets.length) {
      let rowCnt = trSets[0].length

      for (let row = 0; row < rowCnt; row++) {
        let compoundTr = document.createElement('tr')
        tableBodyEl.appendChild(compoundTr)

        for (let trs of trSets) {
          let tr = trs[row]
          let cellEls: HTMLElement[] = Array.prototype.slice.call(tr.childNodes) // TODO: util

          for (let cellEl of cellEls) {
            let cellElCopy = cellEl.cloneNode(true) // deep
            compoundTr.appendChild(cellElCopy)
          }
        }
      }
    }
  }
}


function renderMacroCol(colGroupStat: ColGroupStat, shrinkWidth?: number) {
  let width = colGroupStat.width

  if (width === 'shrink') {
    width = colGroupStat.totalColWidth + sanitizeShrinkWidth(shrinkWidth) + 1 // +1 for border :(
  }

  return (
    <col style={{ width }} />
  )
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
    width: colGroupConfig.width
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
  cols: isColPropsEqual
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
