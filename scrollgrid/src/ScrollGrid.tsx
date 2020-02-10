import {
  h, VNode, createRef, Fragment, render,
  BaseComponent, buildMapSubRenderer,
  isArraysEqual,
  findElements,
  ComponentContext,
  mapHash,
  Scroller,
  RefMap,
  SectionConfig, ColProps, ChunkConfig, CssDimValue, hasShrinkWidth, renderMicroColGroup,
  getScrollGridClassNames, getSectionClassNames, getChunkVGrow, getAllowYScrolling, renderChunkContent, computeForceScrollbars, computeShrinkWidth, getChunkClassNames,
  getIsRtlScrollbarOnLeft,
  setRef,
  computeScrollerClientWidths,
  computeScrollerClientHeights,
  sanitizeShrinkWidth,
  isPropsEqual,
  guid,
  memoizeParallel,
  compareObjs,
  isColPropsEqual
} from '@fullcalendar/core'
import StickyScrolling from './StickyScrolling'
import ClippedScroller, { ClippedOverflowValue } from './ClippedScroller'
import ScrollSyncer, { ScrollSyncerProps } from './ScrollSyncer'
import { getCanVGrowWithinCell } from './table-styling'


export interface ScrollGridProps {
  colGroups?: ColGroupConfig[]
  sections: ScrollGridSectionConfig[]
  vGrow?: boolean
  forPrint?: boolean
}

export interface ScrollGridSectionConfig extends SectionConfig {
  key?: string
  chunks: ChunkConfig[]
  syncRowHeights?: boolean
}

export interface ColGroupConfig {
  width?: CssDimValue
  cols: ColProps[]
}

interface ScrollGridState {
  shrinkWidths: number[] // for only one col within each vertical stack of chunks
  forceYScrollbars: null | boolean // null means not computed yet
  forceXScrollbars: null | boolean // "
  scrollerClientWidths: { [index: string]: number }
  scrollerClientHeights: { [index: string]: number }
  rowSyncHeightSets: number[][]
  sizingId: string
}

interface ColGroupStat {
  hasShrinkCol: boolean
  totalColWidth: number
  totalColMinWidth: number
  allowXScrolling: boolean
  width?: CssDimValue
  cols: ColProps[]
}


export default class ScrollGrid extends BaseComponent<ScrollGridProps, ScrollGridState> {

  private compileColGroupStats = memoizeParallel(compileColGroupStat, isColGroupStatsEqual)
  private renderMicroColGroups = memoizeParallel(renderMicroColGroup) // yucky to memoize VNodes, but much more efficient for consumers
  private printContainerRef = createRef<HTMLDivElement>()
  private clippedScrollerRefs = new RefMap<ClippedScroller>()
  private scrollerElRefs = new RefMap<HTMLElement, [ChunkConfig]>(this._handleScrollerEl.bind(this)) // doesn't hold non-scrolling els used just for padding
  private chunkElRefs = new RefMap<HTMLTableCellElement, [ChunkConfig]>(this._handleChunkEl.bind(this))
  private updateStickyScrollingSubRenderers = buildMapSubRenderer(StickyScrolling)
  private updateScrollSyncersBySection = buildMapSubRenderer(ScrollSyncer)
  private updateScrollSyncersByColumn = buildMapSubRenderer(ScrollSyncer)
  private scrollSyncersBySection: { [sectionI: string]: ScrollSyncer } = {}
  private scrollSyncersByColumn: { [columnI: string]: ScrollSyncer } = {}

  state: ScrollGridState = {
    shrinkWidths: [],
    forceYScrollbars: null,
    forceXScrollbars: null,
    scrollerClientWidths: {},
    scrollerClientHeights: {},
    rowSyncHeightSets: [],
    sizingId: ''
  }


  render(props: ScrollGridProps, state: ScrollGridState, context: ComponentContext) {
    let { colGroups } = props
    let { shrinkWidths } = state
    let colGroupStats = this.compileColGroupStats(colGroups)
    let microColGroupNodes = this.renderMicroColGroups(colGroupStats.map((stat) => stat.cols), shrinkWidths)
    let classNames = getScrollGridClassNames(props.vGrow, context)

    if (!getCanVGrowWithinCell()) {
      classNames.push('scrollgrid-vgrow-cell-hack')
    }

    return (
      <Fragment>
        <table class={classNames.join(' ')} style={{ display: props.forPrint ? 'none' : '' }}>
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
      <tr key={sectionConfig.key} class={getSectionClassNames(sectionConfig, this.props.vGrow).join(' ')}>
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

    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let index = sectionIndex * chunksPerSection + chunkIndex
    let sideScrollIndex = (!this.context.isRtl || getIsRtlScrollbarOnLeft()) ? chunksPerSection - 1 : 0
    let isVScrollSide = chunkIndex === sideScrollIndex
    let isLastSection = sectionIndex === sectionCnt - 1

    let forceXScrollbars = isLastSection && state.forceXScrollbars // can result in `null`
    let forceYScrollbars = isVScrollSide && state.forceYScrollbars // can result in `null`

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
      rowSyncHeights: state.rowSyncHeightSets[sectionIndex] || []
    })

    if (allowYScrolling || allowXScrolling) {
      let overflowX: ClippedOverflowValue =
        forceXScrollbars === true ? (isLastSection ? 'scroll' : 'scroll-hidden') :
        (forceXScrollbars === false || !allowXScrolling) ? 'hidden' :
        (isLastSection ? 'auto' : 'scroll-hidden')

      let overflowY: ClippedOverflowValue =
        forceYScrollbars === true ? (isVScrollSide ? 'scroll' : 'scroll-hidden') :
        (forceYScrollbars === false || !allowYScrolling) ? 'hidden' :
        (isVScrollSide ? 'auto' : 'scroll-hidden')

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
      this.handleSizing(true)
    }

    this.context.addResizeHandler(this.handleSizing)
  }


  componentDidUpdate(prevProps: ScrollGridProps) {
    this.updateScrollSyncers()

    if (this.props.forPrint) {
      this.fillPrintContainer()
    } else {
      // TODO: need better solution when state contains non-sizing things
      this.handleSizing(!isPropsEqual(this.props, prevProps))
    }
  }


  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)

    this.updateScrollSyncersByColumn(false) // TODO: make destroyScrollSyncers method?
    this.updateScrollSyncersBySection(false) //
    this.updateStickyScrollingSubRenderers(false)
  }


  handleSizing = (isExternalChange: boolean) => {
    if (isExternalChange && !this.props.forPrint) {
      let sizingId = guid()
      this.setState({
        sizingId,
        shrinkWidths: this.computeShrinkWidths()
      }, () => {
        if (sizingId === this.state.sizingId) {
          this.setState({
            rowSyncHeightSets: this.computeRowSyncHeightSets() // should happen after shrinkWidths. also, might affect scrollbars
          }, () => {
            if (sizingId === this.state.sizingId) {
              this.setState({
                forceXScrollbars: this.computeForceXScrollbars(),
                forceYScrollbars: this.computeForceYScrollbars()
              }, () => {
                if (sizingId === this.state.sizingId) {
                  this.setState({
                    scrollerClientWidths: computeScrollerClientWidths(this.scrollerElRefs),
                    scrollerClientHeights: computeScrollerClientHeights(this.scrollerElRefs)
                  }, () => {
                    if (sizingId === this.state.sizingId) {
                      this.updateStickyScrolling() // needs to happen AFTER final positioning committed to DOM
                    }
                  })
                }
              })
            }
          })
        }
      })
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


  computeRowSyncHeightSets() {
    let [ sectionCnt, chunksPerSection ] = this.getDims()
    let sectionConfigs = this.props.sections
    let maxInnerHeightSets: number[][] = []

    for (let sectionI = 0; sectionI < sectionCnt; sectionI++) {
      let sectionConfig = sectionConfigs[sectionI]
      let maxInnerHeights: number[]

      if (sectionConfig.syncRowHeights === true) {
        let sectionStart = sectionI * chunksPerSection
        let sectionEnd = sectionStart + chunksPerSection

        let trSets: HTMLElement[][] = []
        this.chunkElRefs.collect(sectionStart, sectionEnd, 1, (cellEL: HTMLElement, key: number, chunkConfig: ChunkConfig) => { // abuse!
          trSets.push(findElements(cellEL, chunkConfig.rowSelector || 'tr'))
          return true
        })

        maxInnerHeights = computeMaxInnerHeights(trSets)
      } else {
        maxInnerHeights = []
      }

      maxInnerHeightSets.push(maxInnerHeights)
    }

    return maxInnerHeightSets
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

ScrollGrid.addStateEquality({
  shrinkWidths: isArraysEqual,
  scrollerClientWidths: isPropsEqual,
  scrollerClientHeights: isPropsEqual,
  sizingId: false // don't update if only this changed
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


function computeMaxInnerHeights(trSets: HTMLElement[][]) {
  let maxInnerHeights: number[] = []
  let row = 0
  let processedTrs

  do {
    processedTrs = 0
    let maxInnerHeight = 0

    for (let chunkI = 0; chunkI < trSets.length; chunkI++) {
      let tr = trSets[chunkI][row]

      if (tr) {
        let heightCreatorEls = findElements(tr, '[data-fc-height-measure]')

        for (let heightCreatorEl of heightCreatorEls) {
          maxInnerHeight = Math.max(maxInnerHeight, heightCreatorEl.getBoundingClientRect().height)
        }

        processedTrs++
      }
    }

    maxInnerHeights.push(maxInnerHeight)
    row++
  } while (processedTrs)

  return maxInnerHeights
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
