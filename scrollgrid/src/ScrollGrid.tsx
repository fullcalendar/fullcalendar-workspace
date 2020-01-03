import {
  h, VNode, createRef, Fragment, render,
  BaseComponent, buildMapSubRenderer,
  isArraysEqual,
  findElements,
  memoize,
  ComponentContext,
  mapHash,
  Scroller,
  RefMap,
  SectionConfig, ColCss, ChunkConfig, CssDimValue, doSizingHacks, hasShrinkWidth, renderMicroColGroup,
  getScrollGridClassNames, getSectionClassNames, getChunkVGrow, getNeedsYScrolling, renderChunkContent, getForceScrollbars, getShrinkWidth, getChunkClassNames,
  getIsRtlScrollbarOnLeft,
  setRef
} from '@fullcalendar/core'
import StickyScrolling from './StickyScrolling'
import ClippedScroller, { ClippedOverflowValue } from './ClippedScroller'
import ScrollSyncer, { ScrollSyncerProps } from './ScrollSyncer'


export interface ScrollGridProps {
  colGroups?: ColGroupConfig[]
  sections: ScrollGridSectionConfig[]
  vGrow?: boolean
  forPrint?: boolean
}

export interface ScrollGridSectionConfig extends SectionConfig {
  chunks: ChunkConfig[]
  syncRowHeights?: boolean
}

export interface ColGroupConfig {
  width?: CssDimValue
  cols: ColCss[]
}

interface ColGroupStat {
  hasShrinkCol: boolean
  totalColWidth: number
  totalColMinWidth: number
  needsXScrolling: boolean
  config: ColGroupConfig
}

interface ScrollGridState {
  forceYScrollbars: boolean
  forceXScrollbars: boolean
  shrinkWidths: number[] // for only one col within each vertical stack of chunks
  isSizingReady: boolean
}


export default class ScrollGrid extends BaseComponent<ScrollGridProps, ScrollGridState> {

  private compileColGroupStats = memoize(compileColGroupStats)
  private printContainerRef = createRef<HTMLDivElement>()
  private clippedScrollerRefs = new RefMap<ClippedScroller>()
  private scrollerElRefs = new RefMap<HTMLElement, [ChunkConfig]>()
  private chunkElRefs = new RefMap<HTMLTableCellElement, [ChunkConfig]>(this._handleChunkEl.bind(this))
  private updateStickyScrollingSubRenderers = buildMapSubRenderer(StickyScrolling)
  private updateScrollSyncersBySection = buildMapSubRenderer(ScrollSyncer)
  private updateScrollSyncersByColumn = buildMapSubRenderer(ScrollSyncer)

  state = {
    forceYScrollbars: false,
    forceXScrollbars: false,
    shrinkWidths: [],
    isSizingReady: false
  }


  render(props: ScrollGridProps, state: ScrollGridState, context: ComponentContext) {
    let colGroups = props.colGroups
    let colGroupStats = this.compileColGroupStats(colGroups)
    let microColGroupNodes = colGroups.map((colGroup, i) => renderMicroColGroup(colGroup.cols, state.shrinkWidths[i]))

    return (
      <Fragment>
        <table class={getScrollGridClassNames(props.vGrow, context).join(' ')} style={{ display: props.forPrint ? 'none' : '' }}>
          <colgroup>
            {colGroupStats.map((colGroupStat, i) => renderMacroCol(colGroupStat, this.state.shrinkWidths[i]))}
          </colgroup>
          {props.sections.map((sectionConfig, i) => this.renderSection(sectionConfig, i, colGroupStats, microColGroupNodes))}
        </table>
        {props.forPrint &&
          <div ref={this.printContainerRef}></div>
        }
      </Fragment>
    )
  }


  renderSection(sectionConfig: ScrollGridSectionConfig, sectionIndex: number, colGroupStats: ColGroupStat[], microColGroupNodes: VNode[]): VNode {

    if (sectionConfig.outerContent) {
      return sectionConfig.outerContent
    }

    return (
      <tr class={getSectionClassNames(sectionConfig, this.props.vGrow).join(' ')}>
        {sectionConfig.chunks.map((chunkConfig, i) =>
          this.renderChunk(sectionConfig, sectionIndex, colGroupStats[i], microColGroupNodes[i], chunkConfig, i))}
      </tr>
    )
  }


  renderChunk(
    sectionConfig: ScrollGridSectionConfig,
    sectionIndex: number,
    colGroupStat: ColGroupStat | undefined,
    microColGroupNode: VNode | undefined,
    chunkConfig: ChunkConfig,
    chunkIndex: number
  ): VNode {

    if (chunkConfig.outerContent) {
      return chunkConfig.outerContent
    }

    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let index = sectionIndex * chunksPerSection + chunkIndex
    let sideScrollIndex = (!this.context.isRtl || getIsRtlScrollbarOnLeft()) ? chunksPerSection - 1 : 0
    let isVScrollSide = chunkIndex === sideScrollIndex
    let isLastSection = sectionIndex === sectionCnt - 1
    let forceY = isVScrollSide && this.state.forceYScrollbars
    let forceX = isLastSection && this.state.forceXScrollbars

    let needsYScrolling = getNeedsYScrolling(this.props, sectionConfig, chunkConfig)
    let needsXScrolling = colGroupStat && colGroupStat.needsXScrolling

    let chunkVGrow = getChunkVGrow(this.props, sectionConfig, chunkConfig)
    let tableMinWidth = (colGroupStat && colGroupStat.totalColMinWidth) || ''
    let content = renderChunkContent(sectionConfig, chunkConfig, microColGroupNode, tableMinWidth)

    if (needsYScrolling || needsXScrolling) {
      let overflowX: ClippedOverflowValue = forceX ? 'scroll' : !needsXScrolling ? 'hidden' : isLastSection ? 'auto' : 'scroll-hidden'
      let overflowY: ClippedOverflowValue = forceY ? 'scroll' : !needsYScrolling ? 'hidden' : isVScrollSide ? 'auto' : 'scroll-hidden'

      content = (
        <ClippedScroller
          ref={this.clippedScrollerRefs.createRef(index)}
          scrollerElRef={this.scrollerElRefs.createRef(index, chunkConfig)}
          overflowX={overflowX}
          overflowY={overflowY}
          vGrow={chunkVGrow}
          maxHeight={sectionConfig.maxHeight}
        >{content}</ClippedScroller>
      )

    } else {
      content = (
        <Scroller
          overflowX={forceX ? 'scroll' : 'hidden'}
          overflowY={forceY ? 'scroll' : 'hidden'}
          vGrow={chunkVGrow}
          maxHeight={sectionConfig.maxHeight}
        >{content}</Scroller>
      )
    }

    return (
      <td ref={this.chunkElRefs.createRef(index, chunkConfig)} class={getChunkClassNames(sectionConfig, this.context)}>
        {content}
      </td>
    )
  }


  componentDidMount() {
    let colGroupStats = this.compileColGroupStats(this.props.colGroups)

    // do all of these??? maybe just do the second time around?
    this.updateScrollSyncers()
    doSizingHacks(this.base as HTMLElement)
    this.updateShrinkWidths(colGroupStats)
    this.syncRowHeights()
    this.syncScrollbarWidths()
    this.updateStickyScrolling()

    window.addEventListener('resize', this.handleWindowResize)

    if (this.props.forPrint) {
      this.fillPrintContainer()
    }
  }


  componentDidUpdate() {
    let colGroupStats = this.compileColGroupStats(this.props.colGroups)

    this.updateScrollSyncers()
    doSizingHacks(this.base as HTMLElement)
    this.updateShrinkWidths(colGroupStats)
    this.syncRowHeights()
    this.syncScrollbarWidths()
    this.updateStickyScrolling()

    if (!this.state.isSizingReady && this.anyChunksNeedSizing()) {
      this.setState({ isSizingReady: true })
    }

    if (this.props.forPrint) {
      this.fillPrintContainer()
    }
  }


  handleWindowResize = () => {
    let colGroupStats = this.compileColGroupStats(this.props.colGroups)

    doSizingHacks(this.base as HTMLElement)
    this.updateScrollSyncers()
    this.updateShrinkWidths(colGroupStats)
    this.syncRowHeights()
    this.syncScrollbarWidths()
    this.updateStickyScrolling()
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize)

    this.updateScrollSyncersByColumn(false)
    this.updateScrollSyncersBySection(false)
    this.updateStickyScrollingSubRenderers(false)
  }


  syncScrollbarWidths() {
    this.syncYScrollbarWidths()
    this.syncXScrollbarWidths()
  }


  syncYScrollbarWidths() {
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let sideScrollIndex = (!this.context.isRtl || getIsRtlScrollbarOnLeft()) ? chunksPerSection - 1 : 0
    let sideClippedScrollers = collectReferences(this.clippedScrollerRefs, sideScrollIndex, sectionCnt * chunksPerSection, chunksPerSection)

    this.setState({
      forceYScrollbars: getForceScrollbars(sideClippedScrollers, 'Y')
    })
  }


  syncXScrollbarWidths() {
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let endIndex = sectionCnt * chunksPerSection
    let startIndex = endIndex - chunksPerSection
    let lastRowClippedScrollers = collectReferences(this.clippedScrollerRefs, startIndex, endIndex)

    this.setState({
      forceXScrollbars: getForceScrollbars(lastRowClippedScrollers, 'X')
    })
  }


  getDims() {
    let sectionCnt = this.props.sections.length
    let chunksPerSection = sectionCnt ? this.props.sections[0].chunks.length : 0

    return [ sectionCnt, chunksPerSection ]
  }


  updateShrinkWidths(colGroupStats: ColGroupStat[]) {
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let cnt = sectionCnt * chunksPerSection
    let shrinkWidths: number[] = []

    colGroupStats.forEach((colGroupStat, i) => {
      if (colGroupStat.hasShrinkCol) {
        let chunkEls = collectReferences(this.chunkElRefs, i, cnt, chunksPerSection) // in one col
        shrinkWidths[i] = getShrinkWidth(chunkEls)
      }
    })

    this.setState({ shrinkWidths })
  }


  updateStickyScrolling() {
    let propsByKey = mapHash(
      this.scrollerElRefs.currentMap,
      (scrollEl, key) => ({ scrollEl })
    )

    let stickyScrollingMap = this.updateStickyScrollingSubRenderers(propsByKey)

    for (let key in stickyScrollingMap) {
      stickyScrollingMap[key].updateSize()
    }
  }


  updateScrollSyncers() {
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let cnt = sectionCnt * chunksPerSection
    let propsBySection: { [sectionI: string]: ScrollSyncerProps } = {}
    let propsByColumn: { [colI: string]: ScrollSyncerProps } = {}

    for (let sectionI = 0; sectionI < sectionCnt; sectionI++) {
      let startIndex = sectionI * chunksPerSection
      let endIndex = startIndex + chunksPerSection

      propsBySection[sectionI] = {
        isVertical: true,
        scrollEls: collectReferences(
          this.scrollerElRefs, startIndex, endIndex, 1,
          (scroller, i, chunkConfig) => !chunkConfig.vGrowRows
        )
      }
    }

    for (let col = 0; col < chunksPerSection; col++) {
      propsByColumn[col] = {
        isVertical: false,
        scrollEls: collectReferences(this.scrollerElRefs, col, cnt, chunksPerSection)
      }
    }

    this.updateScrollSyncersBySection(propsBySection)
    this.updateScrollSyncersByColumn(propsByColumn)
  }


  syncRowHeights() {
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let sectionConfigs = this.props.sections
    let sectionRowSets: HTMLElement[][][] = []

    for (let sectionI = 0; sectionI < sectionCnt; sectionI++) {
      let sectionConfig = sectionConfigs[sectionI]

      if (sectionConfig.syncRowHeights === true) {
        let sectionStart = sectionI * chunksPerSection
        let sectionEnd = sectionStart + chunksPerSection
        let chunkEls = collectReferences(this.chunkElRefs, sectionStart, sectionEnd)

        sectionRowSets[sectionI] = syncSectionRowHeights(chunkEls) // TODO: should accept a selector!!!!, containing the rows
      }
    }

    this.sectionRowSets = sectionRowSets
  }

  sectionRowSets: HTMLElement[][][] = []


  anyChunksNeedSizing() {
    for (let sectionConfig of this.props.sections) {
      for (let chunkConfig of sectionConfig.chunks) {
        if (chunkConfig.needsSizing) {
          return true
        }
      }
    }
    return false
  }


  fillPrintContainer() {
    const handleTableEl = (el: HTMLTableElement | null) => {
      if (el) {
        renderPrintTrs(this.props.sections, this.chunkElRefs, el)
      }
    }

    render( // TODO: change CSS to be layout:normal
      <table ref={handleTableEl} class='scrollgrid scrollgrid--forprint'>
        <colgroup>{renderPrintCols(this.props.colGroups)}</colgroup>
      </table>,
      this.printContainerRef.current
    )
  }


  getColScrollLeft(col: number): number {
    return 0 // TODO: implement, use setScrollFromLeadingEdge
  }


  setColScrollLeft(col: number, scrollLeft: number) {
    // TODO: implement
  }


  getSectionScrollTop(sectionI: number): number {
    return 0 // TODO: implement
  }


  setSectionScrollTop(sectionI: number, scrollTop: number) {
    // TODO: implement
  }


  _handleChunkEl(chunkEl: HTMLTableCellElement | null, key: string, chunkConfig?: ChunkConfig) {
    setRef(chunkConfig.elRef, chunkEl)
  }

}

ScrollGrid.addStateEquality({
  shrinkWidths: isArraysEqual
})



function renderPrintCols(colGroups: ColGroupConfig[]) {
  let colVNodes: VNode[] = []

  for (let colGroup of colGroups) {
    for (let colCss of colGroup.cols) {

      if (colCss.width == null) { // fall back to colGroup...
        if (colGroup.width != null && colGroup.width !== 'shrink') {
          colCss = { ...colCss, width: colGroup.width }
        }
      } else if (colCss.width === 'shrink') {
        colCss = { ...colCss, width: 1 }
      }

      colVNodes.push(<col style={colCss}/>)
    }
  }

  return colVNodes
}


function renderPrintTrs(sectionConfigs: ScrollGridSectionConfig[], chunkElRefs: RefMap<HTMLElement, any>, tableEl: HTMLElement) {

  for (let sectionI = 0; sectionI < sectionConfigs.length; sectionI++) {
    let sectionConfig = sectionConfigs[sectionI]
    let chunksPerSection = sectionConfig.chunks.length

    let tableBodyEl = document.createElement('t' + sectionConfig.type)
    tableEl.appendChild(tableBodyEl)

    let trSets: HTMLElement[][] = []
    let sectionStart = sectionI * chunksPerSection
    let sectionEnd = sectionStart + chunksPerSection
    let chunkEls = collectReferences(chunkElRefs, sectionStart, sectionEnd)

    for (let chunkEl of chunkEls) {
      trSets.push(findElements(chunkEl, 'tr'))
    }

    if (trSets.length) {
      let rowCnt = trSets[0].length

      for (let row = 0; row < rowCnt; row++) {
        let compoundTr = document.createElement('tr')
        tableBodyEl.appendChild(compoundTr)

        for (let chunkI = 0; chunkI < chunksPerSection; chunkI++) {
          let tr = trSets[chunkI][row]
          let cellEls: HTMLElement[] = Array.prototype.slice.call(tr.childNodes) // TODO: util

          for (let cellEl of cellEls) {
            let cellElCopy = cellEl.cloneNode(true) // deep
            compoundTr.appendChild(cellElCopy)
          }
        }
      }
    }
  }

  clearRowHeights(tableEl)
}


function renderMacroCol(colGroupStat: ColGroupStat, shrinkWidth: number) {
  let width = colGroupStat.config.width

  if (width === 'shrink') {
    width = colGroupStat.totalColWidth + shrinkWidth + 1 // AHHHHH BORDER
  }

  return (
    <col style={{ width }} />
  )
}


function syncSectionRowHeights(chunkEls: HTMLTableCellElement[]) {
  let trSets = chunkEls.map((chunkEl) => findElements(chunkEl, 'tr'))
  let rowMetas: { maxInnerHeight: number, heightContainerEls: HTMLElement[] }[] = []
  let row = 0
  let processedTrs

  do {
    processedTrs = 0
    let heightContainerEls: HTMLElement[] = []
    let maxInnerHeight = 0

    for (let chunkI = 0; chunkI < trSets.length; chunkI++) {
      let tr = trSets[chunkI][row]

      if (tr) {
        heightContainerEls.push(...findElements(tr, '.cell-content-wrap'))
        let heightCreatorEls = findElements(tr, '.cell-content')

        for (let heightCreatorEl of heightCreatorEls) {
          maxInnerHeight = Math.max(maxInnerHeight, heightCreatorEl.getBoundingClientRect().height)
        }

        processedTrs++
      }
    }

    rowMetas.push({ maxInnerHeight, heightContainerEls })

    row++
  } while (processedTrs)

  for (let rowMeta of rowMetas) {
    for (let heightContainerEl of rowMeta.heightContainerEls) {
      heightContainerEl.style.height = rowMeta.maxInnerHeight + 'px'
    }
  }

  return trSets
}


function clearRowHeights(containerEl: HTMLElement) {
  let heightSyncedEls = findElements(containerEl, '.cell-content-wrap')

  for (let el of heightSyncedEls) {
    el.style.height = ''
  }
}


function compileColGroupStats(colGroupConfigs: ColGroupConfig[]) {
  return colGroupConfigs.map(compileColGroupStat)
}


function compileColGroupStat(colGroupConfig: ColGroupConfig): ColGroupStat {
  let totalColWidth = sumProps(colGroupConfig.cols, 'width') // excludes "shrink"
  let totalColMinWidth = sumProps(colGroupConfig.cols, 'minWidth')
  let hasShrinkCol = hasShrinkWidth(colGroupConfig.cols)
  let needsXScrolling = colGroupConfig.width !== 'shrink' && Boolean(totalColWidth || totalColMinWidth || hasShrinkCol)

  return {
    hasShrinkCol,
    totalColWidth,
    totalColMinWidth,
    needsXScrolling,
    config: colGroupConfig
  }
}


function collectReferences<T, OtherArgs extends any[] = []>(
  refMap: RefMap<T, OtherArgs>,
  startIndex: number,
  endIndex: number,
  step: number = 1,
  filterFunc?: (val: T, index: number, ...otherArgs: OtherArgs) => boolean
): T[] {
  let res: T[] = []

  for (let i = startIndex; i < endIndex; i += step) {
    let val = refMap.currentMap[i]

    if (val !== undefined) { // will disregard undefined for sparse arrays
      if (!filterFunc || filterFunc(val, i, ...refMap.otherArgsMap[i])) {
        res.push(val)
      }
    }
  }

  return res
}


function sumProps(cols: ColCss[], propName: string) {
  let total = 0

  for (let col of cols) {
    let val = col[propName]

    if (typeof val === 'number') {
      total += val
    }
  }

  return total
}
