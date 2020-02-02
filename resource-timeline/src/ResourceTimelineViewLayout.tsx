import {
  h, createRef, ComponentContext,
  CssDimValue, ElementDragging, PointerDragEvent, BaseComponent, ColProps,
  ChunkConfigRowContent, ChunkConfigContent
} from '@fullcalendar/core'
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
  resourceAreaWidth: CssDimValue
}


export default class ResourceTimelineViewLayout extends BaseComponent<ResourceTimelineViewLayoutProps, ResourceTimelineViewLayoutState> { // RENAME?

  private scrollGridRef = createRef<ScrollGrid>()
  private timeBodyScrollerElRef = createRef<HTMLDivElement>()
  private spreadsheetHeaderChunkElRef = createRef<HTMLTableCellElement>()
  private spreadsheetResizerDragging: ElementDragging


  constructor(props: ResourceTimelineViewLayoutProps, context: ComponentContext) {
    super(props, context)

    this.state = {
      resourceAreaWidth: context.options.resourceAreaWidth
    }
  }


  render(props: ResourceTimelineViewLayoutProps, state: ResourceTimelineViewLayoutState, context: ComponentContext) {
    let { theme } = context

    return (
      <ScrollGrid
        ref={this.scrollGridRef}
        forPrint={props.forPrint}
        vGrow={!props.isHeightAuto}
        colGroups={[
          { cols: props.spreadsheetCols, width: state.resourceAreaWidth },
          { cols: [] }, // for the divider
          { cols: props.timeCols }
        ]}
        sections={[
          {
            type: 'head',
            chunks: [
              {
                vGrowRows: true,
                elRef: this.spreadsheetHeaderChunkElRef,
                className: 'fc-resource-area',
                rowContent: props.spreadsheetHeaderRows
              },
              { outerContent: (
                <td
                  ref={this.handleSpreadsheetResizerEl}
                  rowSpan={2}
                  class={'fc-divider fc-col-resizer ' + theme.getClass('tableCellShaded')}
                />
              ) },
              {
                className: 'fc-time-area',
                content: props.timeHeaderContent
              }
            ]
          },
          {
            type: 'body',
            vGrow: true,
            vGrowRows: Boolean(context.options.expandRows),
            syncRowHeights: true,
            chunks: [
              {
                className: 'fc-resource-area',
                rowContent: props.spreadsheetBodyRows
              },
              { outerContent: null },
              {
                className: 'fc-time-area',
                scrollerElRef: this.timeBodyScrollerElRef,
                content: props.timeBodyContent,
                rowSelector: '.fc-resource-timeline-lanes tr' // for syncRowHeights
              }
            ]
          }
        ]}
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


  handleSpreadsheetResizerEl = (resizerEl: HTMLElement | null) => {
    if (resizerEl) {
      this.initSpreadsheetResizing(resizerEl)
    } else {
      this.destroySpreadsheetResizing()
    }
  }


  initSpreadsheetResizing(resizerEl: HTMLElement) {
    let { isRtl, pluginHooks } = this.context
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl
    let spreadsheetHeadEl = this.spreadsheetHeaderChunkElRef.current

    if (ElementDraggingImpl) {
      let dragging = this.spreadsheetResizerDragging = new ElementDraggingImpl(resizerEl)
      let dragStartWidth
      let viewWidth

      dragging.emitter.on('dragstart', () => {
        dragStartWidth = this.state.resourceAreaWidth
        if (typeof dragStartWidth !== 'number') {
          dragStartWidth = spreadsheetHeadEl.getBoundingClientRect().width
        }
        viewWidth = (this.base as HTMLElement).getBoundingClientRect().width
      })

      dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
        let newWidth = dragStartWidth + pev.deltaX * (isRtl ? -1 : 1)
        newWidth = Math.max(newWidth, MIN_RESOURCE_AREA_WIDTH)
        newWidth = Math.min(newWidth, viewWidth - MIN_RESOURCE_AREA_WIDTH)

        this.setState({ // TODO: debounce?
          resourceAreaWidth: newWidth
        })
      })

      dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area
    }
  }


  destroySpreadsheetResizing() {
    this.spreadsheetResizerDragging.destroy()
  }

}
