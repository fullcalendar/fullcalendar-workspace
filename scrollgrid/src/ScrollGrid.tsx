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
  SectionConfig, ColProps, ChunkConfig, CssDimValue, hasShrinkWidth, renderMicroColGroup,
  getScrollGridClassNames, getSectionClassNames, getChunkVGrow, getNeedsYScrolling, renderChunkContent, computeForceScrollbars, computeShrinkWidth, getChunkClassNames,
  getIsRtlScrollbarOnLeft,
  setRef,
  componentNeedsResize
} from '@fullcalendar/core'
import StickyScrolling from './StickyScrolling'
import ClippedScroller, { ClippedOverflowValue } from './ClippedScroller'
import ScrollSyncer, { ScrollSyncerProps } from './ScrollSyncer'


export interface ScrollGridProps {
  colGroups?: ColGroupConfig[]
  sections: ScrollGridSectionConfig[]
  vGrow?: boolean
  forPrint?: boolean
  needsSizing?: boolean
}

export interface ScrollGridSectionConfig extends SectionConfig {
  chunks: ChunkConfig[]
  syncRowHeights?: boolean
}

export interface ColGroupConfig {
  width?: CssDimValue
  cols: ColProps[]
}

interface ScrollGridState {
  forceYScrollbars: boolean
  forceXScrollbars: boolean
  shrinkWidths: number[] // for only one col within each vertical stack of chunks
  isSizingReady: boolean
}

const STATE_IS_SIZING = {
  forceYScrollbars: true,
  forceXScrollbars: true,
  shrinkWidths: true,
  isSizingReady: true
}

interface ColGroupStat {
  hasShrinkCol: boolean
  totalColWidth: number
  totalColMinWidth: number
  needsXScrolling: boolean
  config: ColGroupConfig
}


export default class ScrollGrid extends BaseComponent<ScrollGridProps, ScrollGridState> {

  private compileColGroupStats = memoize(compileColGroupStats)
  private renderMicroColGroups = memoize(renderMicroColGroups, [ null, isArraysEqual ]) // yucky to memoize VNodes, but much more efficient for consumers
  private printContainerRef = createRef<HTMLDivElement>()
  private clippedScrollerRefs = new RefMap<ClippedScroller>()
  private scrollerElRefs = new RefMap<HTMLElement, [ChunkConfig]>(this._handleScrollerEl.bind(this)) // doesn't hold non-scrolling els used just for padding
  private chunkElRefs = new RefMap<HTMLTableCellElement, [ChunkConfig]>(this._handleChunkEl.bind(this))
  private updateStickyScrollingSubRenderers = buildMapSubRenderer(StickyScrolling)
  private updateScrollSyncersBySection = buildMapSubRenderer(ScrollSyncer)
  private updateScrollSyncersByColumn = buildMapSubRenderer(ScrollSyncer)
  private scrollSyncersBySection: { [sectionI: string]: ScrollSyncer } = {}
  private scrollSyncersByColumn: { [columnI: string]: ScrollSyncer } = {}
  sectionRowSets: HTMLElement[][][] = []

  state = {
    forceYScrollbars: false,
    forceXScrollbars: false,
    shrinkWidths: [],
    isSizingReady: false
  }


  render(props: ScrollGridProps, state: ScrollGridState, context: ComponentContext) {
    let colGroups = props.colGroups
    let colGroupStats = this.compileColGroupStats(colGroups)
    let microColGroupNodes = this.renderMicroColGroups(colGroups, state.shrinkWidths)

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

    if ('outerContent' in sectionConfig) {
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

    if ('outerContent' in chunkConfig) {
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
    let content = renderChunkContent(sectionConfig, chunkConfig, microColGroupNode, tableMinWidth, this.state.isSizingReady)

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
      <td ref={this.chunkElRefs.createRef(index, chunkConfig)} class={getChunkClassNames(sectionConfig, chunkConfig, this.context)}>
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
      if (componentNeedsResize(prevProps, this.props, prevState, this.state, STATE_IS_SIZING)) { // non-sizing stuff changed...
        this.handleSizing()
      }
    }
  }


  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)

    this.updateScrollSyncersByColumn(false) // TODO: make destroyScrollSyncers method?
    this.updateScrollSyncersBySection(false) //
    this.updateStickyScrollingSubRenderers(false)
  }


  handleSizing = () => {
    this.sizingHacks()
    this.syncRowHeights()

    this.setState({
      isSizingReady: false,
      shrinkWidths: this.computeShrinkWidths(),
      forceXScrollbars: this.computeForceXScrollbars(),
      forceYScrollbars: this.computeForceYScrollbars()
    }, () => {
      this.updateStickyScrolling() // needs to happen AFTER final positioning committed to DOM

      if (this.props.needsSizing && !this.state.isSizingReady) { // ONLY sizing state was updated...
        this.setState({ isSizingReady: true })
      }
    })
  }


  sizingHacks() {
    let scrollerElMap = this.scrollerElRefs.currentMap

    // for FF for vGrowRows with a section maxHeight. didn't expand...

    for (let index in scrollerElMap) {
      let scrollerEl = scrollerElMap[index]

      if (!scrollerEl.clientHeight) {
        let clipperEl = scrollerEl.parentNode as HTMLElement
        let cellEl = clipperEl.parentNode as HTMLElement

        cellEl.style.position = 'relative'
        clipperEl.classList.add('vgrow--absolute')
      }
    }

    // for FF sticky els in cells with rowspan...

    let stickyEls = findElements(this.base as HTMLElement, '.vgrow > .fc-sticky')

    for (let stickyEl of stickyEls) {
      let growEl = stickyEl.parentNode as HTMLElement
      let cellEl = growEl.parentNode as HTMLElement

      // too intense to compute padding, so hardcode 10 might not make the fix when there's
      // a small difference in height, but stickiness isn't valuable in that scenario
      if (growEl.offsetWidth < cellEl.offsetHeight - 10) {
        cellEl.style.position = 'relative'
        growEl.classList.add('vgrow--absolute')
      }
    }
  }


  computeShrinkWidths() {
    let colGroupStats = this.compileColGroupStats(this.props.colGroups)
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


  computeForceYScrollbars() {
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let sideScrollIndex = (!this.context.isRtl || getIsRtlScrollbarOnLeft()) ? chunksPerSection - 1 : 0
    let sideClippedScrollers = this.clippedScrollerRefs.collect(sideScrollIndex, sectionCnt * chunksPerSection, chunksPerSection)

    return computeForceScrollbars(sideClippedScrollers, 'Y')
  }


  computeForceXScrollbars() {
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let endIndex = sectionCnt * chunksPerSection
    let startIndex = endIndex - chunksPerSection
    let lastRowClippedScrollers = this.clippedScrollerRefs.collect(startIndex, endIndex)

    return computeForceScrollbars(lastRowClippedScrollers, 'X')
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
        scrollEls: this.scrollerElRefs.collect(
          startIndex, endIndex, 1,
          (scroller, i, chunkConfig) => !chunkConfig.vGrowRows
        )
      }
    }

    for (let col = 0; col < chunksPerSection; col++) {
      propsByColumn[col] = {
        isVertical: false,
        scrollEls: this.scrollerElRefs.collect(col, cnt, chunksPerSection)
      }
    }

    this.scrollSyncersBySection = this.updateScrollSyncersBySection(propsBySection)
    this.scrollSyncersByColumn = this.updateScrollSyncersByColumn(propsByColumn)
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
        let chunkEls = this.chunkElRefs.collect(sectionStart, sectionEnd)

        sectionRowSets[sectionI] = syncSectionRowHeights(chunkEls) // TODO: should accept a selector!!!!, containing the rows
      }
    }

    this.sectionRowSets = sectionRowSets
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


  _handleChunkEl(chunkEl: HTMLTableCellElement | null, key: string, chunkConfig?: ChunkConfig) {
    setRef(chunkConfig.elRef, chunkEl)
  }


  _handleScrollerEl(scrollerEl: HTMLElement | null, key: string, chunkConfig: ChunkConfig) {
    setRef(chunkConfig.scrollerElRef, scrollerEl)
  }


  getDims() {
    let sectionCnt = this.props.sections.length
    let chunksPerSection = sectionCnt ? this.props.sections[0].chunks.length : 0

    return [ sectionCnt, chunksPerSection ]
  }

}

ScrollGrid.addStateEquality({
  shrinkWidths: isArraysEqual
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


function renderPrintTrs(sectionConfigs: ScrollGridSectionConfig[], chunkElRefs: RefMap<HTMLElement, any>, tableEl: HTMLElement) {

  for (let sectionI = 0; sectionI < sectionConfigs.length; sectionI++) {
    let sectionConfig = sectionConfigs[sectionI]
    let chunksPerSection = sectionConfig.chunks.length

    let tableBodyEl = document.createElement('t' + sectionConfig.type)
    tableEl.appendChild(tableBodyEl)

    let trSets: HTMLElement[][] = []
    let sectionStart = sectionI * chunksPerSection
    let sectionEnd = sectionStart + chunksPerSection
    let chunkEls = chunkElRefs.collect(sectionStart, sectionEnd)

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
    width = colGroupStat.totalColWidth + shrinkWidth
  }

  return (
    <col style={{ width }} />
  )
}


function renderMicroColGroups(colConfigs: ColGroupConfig[], shrinkWidths: number[]) {
  return colConfigs.map((colConfig, i) => renderMicroColGroup(colConfig.cols, shrinkWidths[i]))
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
        heightContainerEls.push(...findElements(tr, '[data-fc-height-control]'))
        let heightCreatorEls = findElements(tr, '[data-fc-height-measure]')

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
  let heightSyncedEls = findElements(containerEl, '[data-fc-height-control]')

  for (let el of heightSyncedEls) {
    el.style.height = ''
  }
}


function compileColGroupStats(colGroupConfigs: ColGroupConfig[]) {
  return colGroupConfigs.map(compileColGroupStat)
}


function compileColGroupStat(colGroupConfig: ColGroupConfig): ColGroupStat {
  let totalColWidth = sumColProp(colGroupConfig.cols, 'width') // excludes "shrink"
  let totalColMinWidth = sumColProp(colGroupConfig.cols, 'minWidth')
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
