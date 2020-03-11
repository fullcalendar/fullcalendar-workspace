import {
  h, VNode, createRef, Fragment, render,
  BaseComponent,
  isArraysEqual,
  findElements,
  ComponentContext,
  mapHash,
  Scroller,
  RefMap,
  ColProps, ChunkConfig, CssDimValue, hasShrinkWidth, renderMicroColGroup,
  ScrollGridProps, ScrollGridSectionConfig, ColGroupConfig,
  getScrollGridClassNames, getSectionClassNames, getChunkVGrow, getAllowYScrolling, renderChunkContent, computeShrinkWidth, getChunkClassNames,
  getIsRtlScrollbarOnLeft,
  setRef,
  sanitizeShrinkWidth,
  isPropsEqual,
  compareObjs,
  isColPropsEqual,
  getScrollbarWidths,
  memoizeArraylike,
  CLIENT_HEIGHT_WIGGLE,
  filterHash,
  collectFromHash,
  memoizeHashlike,
  getCanVGrowWithinCell
} from '@fullcalendar/core'
import StickyScrolling from './StickyScrolling'
import ClippedScroller, { ClippedOverflowValue } from './ClippedScroller'
import ScrollSyncer from './ScrollSyncer'


interface ScrollGridState {
  shrinkWidths: number[] // for only one col within each vertical stack of chunks
  forceYScrollbars: boolean // null means not computed yet
  forceXScrollbars: boolean // "
  scrollerClientWidths: { [index: string]: number } // why not use array?
  scrollerClientHeights: { [index: string]: number }
}

interface ColGroupStat {
  hasShrinkCol: boolean
  totalColWidth: number
  totalColMinWidth: number
  allowXScrolling: boolean
  width?: CssDimValue
  cols: ColProps[]
}


export default class ScrollGrid extends BaseComponent<ScrollGridProps, ScrollGridState> { // TODO: make <ScrollGridSection> subcomponent

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
  private getReportRowHeightFuncs = memoizeArraylike(
    (sectionI: number, chunkI: number) => this._reportRowHeight.bind(this, sectionI, chunkI)
  )

  state: ScrollGridState = {
    shrinkWidths: [],
    forceYScrollbars: false,
    forceXScrollbars: false,
    scrollerClientWidths: {},
    scrollerClientHeights: {}
  }

  sectionRowHeights: { [rowKey: string]: number }[][] = []


  render(props: ScrollGridProps, state: ScrollGridState, context: ComponentContext) {
    let { shrinkWidths } = state

    let colGroupStats = this.compileColGroupStats(props.colGroups.map((colGroup) => [ colGroup ]))
    let microColGroupNodes = this.renderMicroColGroups(colGroupStats.map((stat, i) => [ stat.cols, shrinkWidths[i] ]))
    let classNames = getScrollGridClassNames(props.vGrow, context)

    // yuck
    let indices: [ number, number ][] = []
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    for (let sectionI = 0; sectionI < sectionCnt; sectionI++) {
      for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) {
        indices.push([ sectionI, chunkI ])
      }
    }
    let reportRowHeightFuncs = this.getReportRowHeightFuncs(indices)

    if (!getCanVGrowWithinCell()) {
      classNames.push('scrollgrid-vgrow-cell-hack')
    }

    return (
      <Fragment>
        <table class={classNames.join(' ')} style={{ display: props.forPrint ? 'none' : '' }}>
          <colgroup>
            {colGroupStats.map((colGroupStat, i) => renderMacroCol(colGroupStat, shrinkWidths[i]))}
          </colgroup>
          {props.sections.map((sectionConfig, i) => this.renderSection(sectionConfig, i, colGroupStats, microColGroupNodes, reportRowHeightFuncs))}
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
    reportRowHeightFuncs: ((rowId: string, innerEl: HTMLElement) => void)[]
  ): VNode {

    if ('outerContent' in sectionConfig) {
      return sectionConfig.outerContent
    }

    let rowHeights = this.computeSectionRowHeights(sectionIndex) // TODO: memoize somehow?
    let chunksPerSection = this.getDims()[1]

    return (
      <tr key={sectionConfig.key} class={getSectionClassNames(sectionConfig, this.props.vGrow).join(' ')}>
        {sectionConfig.chunks.map((chunkConfig, i) => {
          return this.renderChunk(
            sectionConfig,
            sectionIndex,
            colGroupStats[i],
            microColGroupNodes[i],
            chunkConfig,
            i,
            rowHeights,
            reportRowHeightFuncs[sectionIndex * chunksPerSection + i]
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
    rowHeights: { [rowKey: string]: number },
    reportRowHeight: (rowId: string, innerEl: HTMLElement) => void
  ): VNode {

    if ('outerContent' in chunkConfig) {
      return chunkConfig.outerContent
    }

    let { state } = this

    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let index = sectionIndex * chunksPerSection + chunkIndex
    let sideScrollIndex = (!this.context.isRtl || getIsRtlScrollbarOnLeft()) ? chunksPerSection - 1 : 0
    let isVScrollSide = chunkIndex === sideScrollIndex
    let isLastSection = sectionIndex === sectionCnt - 1

    let forceXScrollbars = isLastSection && state.forceXScrollbars // NOOOO can result in `null`
    let forceYScrollbars = isVScrollSide && state.forceYScrollbars // NOOOO can result in `null`

    let allowXScrolling = colGroupStat && colGroupStat.allowXScrolling // rename?
    let allowYScrolling = getAllowYScrolling(this.props, sectionConfig, chunkConfig) // rename?

    let chunkVGrow = getChunkVGrow(this.props, sectionConfig, chunkConfig)
    let tableMinWidth = (colGroupStat && colGroupStat.totalColMinWidth) || ''

    let content = renderChunkContent(sectionConfig, chunkConfig, {
      tableColGroupNode: microColGroupNode,
      tableMinWidth,
      clientWidth: state.scrollerClientWidths[index] || '',
      clientHeight: state.scrollerClientHeights[index] || '',
      vGrowRows: sectionConfig.vGrowRows || chunkConfig.vGrowRows,
      rowSyncHeights: rowHeights,
      reportRowHeight: reportRowHeight
    })

    if (allowYScrolling || allowXScrolling) {
      let overflowX: ClippedOverflowValue =
        forceXScrollbars ? (isLastSection ? 'scroll' : 'scroll-hidden') :
        !allowXScrolling ? 'hidden' :
        (isLastSection ? 'auto' : 'scroll-hidden')

      let overflowY: ClippedOverflowValue =
        forceYScrollbars ? (isVScrollSide ? 'scroll' : 'scroll-hidden') :
        !allowYScrolling ? 'hidden' :
        (isVScrollSide ? 'auto' : 'scroll-hidden')

      content = (
        <ClippedScroller
          ref={this.clippedScrollerRefs.createRef(index)}
          scrollerElRef={this.scrollerElRefs.createRef(index)}
          overflowX={overflowX}
          overflowY={overflowY}
          vGrow={chunkVGrow}
          maxHeight={sectionConfig.maxHeight}
        >{content}</ClippedScroller>
      )

    } else {
      content = ( // TODO: need scrollerharness too?
        <Scroller
          overflowX={forceXScrollbars ? 'scroll' : 'hidden'}
          overflowY={forceYScrollbars ? 'scroll' : 'hidden'}
          vGrow={chunkVGrow}
          maxHeight={sectionConfig.maxHeight}
        >{content}</Scroller>
      )
    }

    return (
      <td ref={this.chunkElRefs.createRef(index)} class={getChunkClassNames(sectionConfig, chunkConfig, this.context)}>
        {content}
      </td>
    )
  }


  _reportRowHeight(sectionI: number, chunkI: number, rowKey: string, el: HTMLElement | null) {
    let { sectionRowHeights } = this

    // TODO: reclaim memory when a chunk is killed, for sectionRowHeights
    // TODO: use 1-dim `index` for sectionRowHeights?

    if (el) {
      if (!sectionRowHeights[sectionI]) sectionRowHeights[sectionI] = []
      if (!sectionRowHeights[sectionI][chunkI]) sectionRowHeights[sectionI][chunkI] = {}
      sectionRowHeights[sectionI][chunkI][rowKey] = el.getBoundingClientRect().height

    } else if (
      sectionRowHeights[sectionI] &&
      sectionRowHeights[sectionI][chunkI]
    ) {
      delete sectionRowHeights[sectionI][chunkI][rowKey]
    }

    this.forceUpdate()
  }


  computeSectionRowHeights(sectionI) { // bad name
    let maxes: { [rowKey: string]: number } = {}
    let sectionRowHeights = this.sectionRowHeights[sectionI] || []

    for (let chunkRowHeights of sectionRowHeights) {
      for (let rowKey in chunkRowHeights) {
        if (maxes[rowKey] === undefined) {
          maxes[rowKey] = chunkRowHeights[rowKey]
        } else {
          maxes[rowKey] = Math.max(maxes[rowKey], chunkRowHeights[rowKey])
        }
      }
    }

    return maxes
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


  componentDidUpdate(prevProps: ScrollGridProps) {
    this.updateScrollSyncers()

    if (this.props.forPrint) {
      this.fillPrintContainer()
    } else {
      // TODO: need better solution when state contains non-sizing things
      this.handleSizing()
    }
  }


  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)

    this.destroyStickyScrolling()
    this.destroyScrollSyncers()
  }


  handleSizing = () => {
    this.setState({
      shrinkWidths: this.computeShrinkWidths(),
      ...this.computeScrollerDims()
    }, () => {
      this.updateStickyScrolling() // needs to happen AFTER final positioning committed to DOM
    })
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


  computeScrollerDims() {
    let scrollbarWidth = getScrollbarWidths()
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let sideScrollI = (!this.context.isRtl || getIsRtlScrollbarOnLeft()) ? chunksPerSection - 1 : 0
    let lastSectionI = sectionCnt - 1
    let currentScrollers = this.clippedScrollerRefs.currentMap
    let currentScrollerEls = this.scrollerElRefs.currentMap
    let forceYScrollbars = false
    let forceXScrollbars = false
    let scrollerClientWidths: { [index: string]: number } = {}
    let scrollerClientHeights: { [index: string]: number } = {}

    for (let sectionI = 0; sectionI < sectionCnt; sectionI++) { // along edge
      let scroller = currentScrollers[sectionI * chunksPerSection + sideScrollI]

      if (scroller && scroller.needsYScrolling()) {
        forceYScrollbars = true
        break
      }
    }

    for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) { // along last row
      let scroller = currentScrollers[lastSectionI * chunksPerSection + chunkI]

      if (scroller && scroller.needsXScrolling()) {
        forceXScrollbars = true
        break
      }
    }

    for (let sectionI = 0; sectionI < sectionCnt; sectionI++) {
      for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) {
        let index = sectionI * chunksPerSection + chunkI
        let scrollerEl = currentScrollerEls[index]

        if (scrollerEl) {
          scrollerClientWidths[index] = (chunkI === sideScrollI && forceYScrollbars) // TODO: problem with border/padding maybe?
            ? scrollerEl.offsetWidth - scrollbarWidth.y
            : scrollerEl.clientWidth // will be doing hidden-scroll

          scrollerClientHeights[index] = (sectionI === lastSectionI && forceXScrollbars)
            ? scrollerEl.offsetHeight - scrollbarWidth.x
            : scrollerEl.clientHeight - CLIENT_HEIGHT_WIGGLE // will be doing hidden-scroll
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

    scrollElMap = filterHash(scrollElMap, (scrollEl: HTMLElement, index: number) => {
      return !this.getChunkConfigByIndex(index).vGrowRows
    })

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
      <table ref={this.handlePrintTableEl} class='scrollgrid scrollgrid--forprint'>
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
    width = colGroupStat.totalColWidth + sanitizeShrinkWidth(shrinkWidth)
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
