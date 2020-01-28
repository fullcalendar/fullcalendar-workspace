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
  computeScrollerClientWidths,
  computeScrollerClientHeights,
  sanitizeShrinkWidth
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
  cols: ColProps[]
}

interface ScrollGridState {
  isSizingReady: boolean
  shrinkWidths: null | number[] // for only one col within each vertical stack of chunks
  forceYScrollbars: null | boolean
  forceXScrollbars: null | boolean
  scrollerClientWidths: null | { [index: string]: number }
  scrollerClientHeights: null | { [index: string]: number }
}

const INITIAL_SIZING_STATE: ScrollGridState = {
  isSizingReady: false,
  shrinkWidths: null,
  forceYScrollbars: null,
  forceXScrollbars: null,
  scrollerClientWidths: null,
  scrollerClientHeights: null
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

  state = INITIAL_SIZING_STATE // react won't mutate the constant


  static getDerivedStateFromProps(props: ScrollGridProps, state: ScrollGridState) {
    if (state.isSizingReady) { // means non-sizing prop/state has changed that will affect sizing
      return INITIAL_SIZING_STATE
    } else if (state.scrollerClientWidths) { // the last sizing-state was just set
      return { isSizingReady: true }
    }
  }


  render(props: ScrollGridProps, state: ScrollGridState, context: ComponentContext) {
    let colGroups = props.colGroups
    let colGroupStats = this.compileColGroupStats(colGroups)
    let shrinkWidths = state.shrinkWidths || []
    let microColGroupNodes = this.renderMicroColGroups(colGroups, shrinkWidths)

    return (
      <Fragment>
        <table class={getScrollGridClassNames(props.vGrow, context).join(' ')} style={{ display: props.forPrint ? 'none' : '' }}>
          <colgroup>
            {colGroupStats.map((colGroupStat, i) => renderMacroCol(colGroupStat, shrinkWidths[i]))}
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

    let { state } = this
    let { isSizingReady } = state

    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let index = sectionIndex * chunksPerSection + chunkIndex
    let sideScrollIndex = (!this.context.isRtl || getIsRtlScrollbarOnLeft()) ? chunksPerSection - 1 : 0
    let isVScrollSide = chunkIndex === sideScrollIndex
    let isLastSection = sectionIndex === sectionCnt - 1
    let forceY = isVScrollSide && state.forceYScrollbars
    let forceX = isLastSection && state.forceXScrollbars

    let needsYScrolling = getNeedsYScrolling(this.props, sectionConfig, chunkConfig)
    let needsXScrolling = colGroupStat && colGroupStat.needsXScrolling

    let chunkVGrow = getChunkVGrow(this.props, sectionConfig, chunkConfig)
    let tableMinWidth = (colGroupStat && colGroupStat.totalColMinWidth) || ''

    let content = renderChunkContent(sectionConfig, chunkConfig, {
      tableColGroupNode: microColGroupNode,
      tableMinWidth,
      tableWidth: isSizingReady ? state.scrollerClientWidths[index] : '',
      tableHeight: isSizingReady ? state.scrollerClientHeights[index] : '',
      isSizingReady
    })

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
    this.rendered()
    this.context.addResizeHandler(this.handleResize)
  }


  componentDidUpdate(prevProps: ScrollGridProps, prevState: ScrollGridState) {
    this.rendered()
  }


  rendered() {
    this.updateScrollSyncers()

    if (this.props.forPrint) {
      this.fillPrintContainer()
    } else {
      this.adjustSizing()
    }
  }


  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleResize)

    this.updateScrollSyncersByColumn(false) // TODO: make destroyScrollSyncers method?
    this.updateScrollSyncersBySection(false) //
    this.updateStickyScrollingSubRenderers(false)
  }


  adjustSizing() {
    let { state } = this

    if (!state.shrinkWidths) {
      this.sizingHacks() // needs to happen first step
      this.setState({
        shrinkWidths: this.computeShrinkWidths()
      })

    } else if (state.forceXScrollbars == null) {
      this.syncRowHeights() // should happen after shrinkWidths. might affect scrollbars
      this.setState({
        forceXScrollbars: this.computeForceXScrollbars(),
        forceYScrollbars: this.computeForceYScrollbars()
      })

    } else if (!state.scrollerClientWidths) {
      this.setState({
        scrollerClientWidths: computeScrollerClientWidths(this.scrollerElRefs),
        scrollerClientHeights: computeScrollerClientHeights(this.scrollerElRefs)
      })

    } else {
      this.updateStickyScrolling() // needs to happen AFTER final positioning committed to DOM
    }
  }


  handleResize = () => {
    if (!this.props.forPrint) {
      this.forceUpdate() // getDerivedStateFromProps will clear the sizing state
    }
  }


  // still need these?
  // can do them as part of computeScrollerClientHeights(this.scrollerElRefs) ?
  sizingHacks() {

    // for FF for vGrowRows with a section maxHeight. didn't expand...

    let scrollerElMap = this.scrollerElRefs.currentMap

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


  // TODO: optimize with hasShrinkWidth like SimpleScrollGrid?
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

    let trSets: HTMLElement[][] = []
    let chunksPerSection = sectionConfig.chunks.length
    let sectionStart = sectionI * chunksPerSection
    let sectionEnd = sectionStart + chunksPerSection
    let chunkEls = chunkElRefs.collect(sectionStart, sectionEnd)

    let tableBodyEl = document.createElement('t' + sectionConfig.type)
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

  clearRowHeights(tableEl)
}


function renderMacroCol(colGroupStat: ColGroupStat, shrinkWidth?: number) {
  let width = colGroupStat.config.width

  if (width === 'shrink') {
    width = colGroupStat.totalColWidth + sanitizeShrinkWidth(shrinkWidth)
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
