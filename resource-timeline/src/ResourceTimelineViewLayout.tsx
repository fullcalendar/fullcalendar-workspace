import {
  createElement, createRef, ElementDragging, PointerDragEvent, BaseComponent, ColProps,
  ChunkConfigRowContent, ChunkConfigContent, ScrollGridSectionConfig,
  renderScrollShim,
  getStickyHeaderDates,
  getStickyFooterScrollbar,
  config,
} from '@fullcalendar/common'
import { ScrollGrid } from '@fullcalendar/scrollgrid'

const MIN_RESOURCE_AREA_WIDTH = 30 // definitely bigger than scrollbars

export interface ResourceTimelineViewLayoutProps {
  spreadsheetCols: ColProps[]
  spreadsheetHeaderRows: ChunkConfigRowContent
  spreadsheetBodyRows: ChunkConfigRowContent
  timeCols: ColProps[]
  timeHeaderContent: ChunkConfigContent
  timeBodyContent: ChunkConfigContent
  forPrint: boolean
  isHeightAuto: boolean
}

interface ResourceTimelineViewLayoutState {
  resourceAreaWidthOverride: number | null
}

// RENAME?
export class ResourceTimelineViewLayout extends BaseComponent<ResourceTimelineViewLayoutProps, ResourceTimelineViewLayoutState> {
  private scrollGridRef = createRef<ScrollGrid>()
  private timeBodyScrollerElRef = createRef<HTMLDivElement>()
  private spreadsheetHeaderChunkElRef = createRef<HTMLTableCellElement>()
  private spreadsheetResizerDragging: ElementDragging
  private rootElRef = createRef<HTMLElement>()
  private ensureScrollGridResizeId: number = 0

  state = {
    resourceAreaWidthOverride: null,
  }

  render() {
    let { props, state, context } = this
    let { options } = context
    let stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    let stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    let sections: ScrollGridSectionConfig[] = [
      {
        type: 'header',
        key: 'header',
        syncRowHeights: true,
        isSticky: stickyHeaderDates,
        chunks: [
          {
            key: 'datagrid',
            elRef: this.spreadsheetHeaderChunkElRef,
            // TODO: allow the content to specify this. have general-purpose 'content' with obj with keys
            tableClassName: 'fc-datagrid-header',
            rowContent: props.spreadsheetHeaderRows,
          },
          {
            key: 'divider',
            outerContent: (
              <td className={'fc-resource-timeline-divider ' + context.theme.getClass('tableCellShaded')} />
            ),
          },
          {
            key: 'timeline',
            content: props.timeHeaderContent,
          },
        ],
      },
      {
        type: 'body',
        key: 'body',
        syncRowHeights: true,
        liquid: true,
        expandRows: Boolean(options.expandRows),
        chunks: [
          {
            key: 'datagrid',
            tableClassName: 'fc-datagrid-body',
            rowContent: props.spreadsheetBodyRows,
          },
          {
            key: 'divider',
            outerContent: (
              <td className={'fc-resource-timeline-divider ' + context.theme.getClass('tableCellShaded')} />
            ),
          },
          {
            key: 'timeline',
            scrollerElRef: this.timeBodyScrollerElRef,
            content: props.timeBodyContent,
          },
        ],
      },
    ]

    if (stickyFooterScrollbar) {
      sections.push({
        type: 'footer',
        key: 'footer',
        isSticky: true,
        chunks: [
          {
            key: 'datagrid',
            content: renderScrollShim,
          },
          {
            key: 'divider',
            outerContent: (
              <td className={'fc-resource-timeline-divider ' + context.theme.getClass('tableCellShaded')} />
            ),
          },
          {
            key: 'timeline',
            content: renderScrollShim,
          },
        ],
      })
    }

    let resourceAreaWidth = state.resourceAreaWidthOverride != null
      ? state.resourceAreaWidthOverride
      : options.resourceAreaWidth

    return (
      <ScrollGrid
        ref={this.scrollGridRef}
        elRef={this.rootElRef}
        liquid={!props.isHeightAuto && !props.forPrint}
        collapsibleWidth={false}
        colGroups={[
          { cols: props.spreadsheetCols, width: resourceAreaWidth },
          { cols: [] }, // for the divider
          { cols: props.timeCols },
        ]}
        sections={sections}
      />
    )
  }

  forceTimeScroll(left: number) {
    let scrollGrid = this.scrollGridRef.current
    scrollGrid.forceScrollLeft(2, left) // 2 = the time area
  }

  forceResourceScroll(top: number) {
    let scrollGrid = this.scrollGridRef.current
    scrollGrid.forceScrollTop(1, top) // 1 = the body
  }

  getResourceScroll(): number {
    let timeBodyScrollerEl = this.timeBodyScrollerElRef.current
    return timeBodyScrollerEl.scrollTop
  }

  // Resource Area Resizing
  // ------------------------------------------------------------------------------------------
  // NOTE: a callback Ref for the resizer was firing multiple times with same elements (Preact)
  // that's why we use spreadsheetResizerElRef instead

  componentDidMount() {
    this.initSpreadsheetResizing()
  }

  componentWillUnmount() {
    this.destroySpreadsheetResizing()
  }

  initSpreadsheetResizing() {
    let { isRtl, pluginHooks } = this.context
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl
    let spreadsheetHeadEl = this.spreadsheetHeaderChunkElRef.current

    if (ElementDraggingImpl) {
      let rootEl = this.rootElRef.current
      let dragging = this.spreadsheetResizerDragging = new ElementDraggingImpl(rootEl, '.fc-resource-timeline-divider')
      let dragStartWidth
      let viewWidth

      dragging.emitter.on('dragstart', () => {
        dragStartWidth = spreadsheetHeadEl.getBoundingClientRect().width
        viewWidth = rootEl.getBoundingClientRect().width
      })

      dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
        let newWidth = dragStartWidth + pev.deltaX * (isRtl ? -1 : 1)
        newWidth = Math.max(newWidth, MIN_RESOURCE_AREA_WIDTH)
        newWidth = Math.min(newWidth, viewWidth - MIN_RESOURCE_AREA_WIDTH)

        // scrollgrid will ignore resize requests if there are too many :|
        this.setState({
          resourceAreaWidthOverride: newWidth,
        }, this.ensureScrollGridResize)
      })

      dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area
    }
  }

  destroySpreadsheetResizing() {
    if (this.spreadsheetResizerDragging) {
      this.spreadsheetResizerDragging.destroy()
    }
  }

  /*
  ghetto debounce. don't race with ScrollGrid's resizing delay. solves #6140
  */
  ensureScrollGridResize = () => {
    if (this.ensureScrollGridResizeId) {
      clearTimeout(this.ensureScrollGridResizeId)
    }
    this.ensureScrollGridResizeId = setTimeout(() => {
      this.scrollGridRef.current.handleSizing(false)
    }, config.SCROLLGRID_RESIZE_INTERVAL + 1)
  }
}
