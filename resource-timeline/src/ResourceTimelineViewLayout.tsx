import { BaseComponent, ComponentContext, subrenderer, ElementDragging, PointerDragEvent, applyStyleProp } from '@fullcalendar/core'
import { ClippedScroller, ScrollJoiner } from '@fullcalendar/timeline'
import RowHeightSyncer from './RowHeightSyncer'
import { h, ComponentChildren, createRef } from 'preact'


export interface ResourceTimelineViewLayoutProps {
  spreadsheetHeadContent?: ComponentChildren
  spreadsheetBodyContent?: ComponentChildren
  timeHeadContent?: ComponentChildren
  timeBodyFgContent?: ComponentChildren
  timeBodyBgContent?: ComponentChildren
}

const MIN_RESOURCE_AREA_WIDTH = 30 // definitely bigger than scrollbars


export default class ResourceTimelineViewLayout extends BaseComponent<ResourceTimelineViewLayoutProps> {

  private rootElRef = createRef<HTMLTableElement>()
  private spreadsheetHeadElRef = createRef<HTMLTableCellElement>()
  private spreadsheetHeadScrollerRef = createRef<ClippedScroller>()
  private spreadsheetBodyScrollerRef = createRef<ClippedScroller>()
  private timeHeadScrollerRef = createRef<ClippedScroller>()
  private timeBodyScrollerRef = createRef<ClippedScroller>()
  private getBodyScrollJoiner = subrenderer(ScrollJoiner)
  private getSpreadsheetScrollJoiner = subrenderer(ScrollJoiner)
  private getTimeScrollJoiner = subrenderer(ScrollJoiner)
  private resizerHeadElRef = createRef<HTMLTableCellElement>()
  private resizerBodyElRef = createRef<HTMLTableCellElement>()
  private updateSpreadsheetResizingFromHead = subrenderer(this._initSpreadsheetWidthResizing, this._destroySpreadsheetWidthResizing)
  private updateSpreadsheetResizingFromBody = subrenderer(this._initSpreadsheetWidthResizing, this._destroySpreadsheetWidthResizing)
  private spreadsheetWidth: number

  headRowSyncer = new RowHeightSyncer()
  bodyRowSyncer = new RowHeightSyncer()

  get timeHeadScroller() { return this.timeHeadScrollerRef.current }
  get timeBodyScroller() { return this.timeBodyScrollerRef.current }
  get spreadsheetBodyScroller() { return this.spreadsheetBodyScrollerRef.current }


  render(props: ResourceTimelineViewLayoutProps, state: {}, context: ComponentContext) {
    let { theme } = context

    return (
      <table class={theme.getClass('tableGrid')} ref={this.rootElRef}>
        <thead class='fc-head'>
          <tr>
            <td class={'fc-resource-area ' + theme.getClass('widgetHeader') } ref={this.spreadsheetHeadElRef}>
              <ClippedScroller
                ref={this.spreadsheetHeadScrollerRef}
                overflowX='clipped-scroll'
                overflowY='hidden'
                fgContent={props.spreadsheetHeadContent}
              />
            </td>
            <td
              ref={this.resizerHeadElRef}
              class={'fc-divider fc-col-resizer ' + theme.getClass('widgetHeader')}
            />
            <td class={'fc-time-area ' + theme.getClass('widgetHeader')}>
              <ClippedScroller
                ref={this.timeHeadScrollerRef}
                overflowX='clipped-scroll'
                overflowY='hidden'
                fgContent={props.timeHeadContent}
              />
            </td>
          </tr>
        </thead>
        <tbody class='fc-body'>
          <tr>
            <td class={'fc-resource-area ' + theme.getClass('widgetContent')}>
              <ClippedScroller
                ref={this.spreadsheetBodyScrollerRef}
                overflowX='auto'
                overflowY='clipped-scroll'
                fgContent={props.spreadsheetBodyContent}
                isVerticalStickyScrolling={true}
              />
            </td>
            <td
              ref={this.resizerBodyElRef}
              class={'fc-divider fc-col-resizer ' + theme.getClass('widgetHeader')}
            />
            <td class={'fc-time-area ' + theme.getClass('widgetContent')}>
              <ClippedScroller
                ref={this.timeBodyScrollerRef}
                overflowX='auto'
                overflowY='auto'
                fgContent={props.timeBodyFgContent}
                bgContent={props.timeBodyBgContent}
              />
            </td>
          </tr>
        </tbody>
      </table>
    )
  }


  componentDidMount() {
    this.subrender()
  }


  componentDidUpdate() {
    this.subrender()
  }


  componentWillUnmount() {
    this.subrenderDestroy()
  }


  subrender() {
    this.updateSpreadsheetResizingFromHead({
      resizerEl: this.resizerHeadElRef.current
    })

    this.updateSpreadsheetResizingFromBody({
      resizerEl: this.resizerBodyElRef.current
    })
  }


  getTimeAvailableWidth() {
    return this.timeBodyScroller.enhancedScroller.scroller.controller.getClientWidth()
  }


  setTimeWidths(containerWidth, containerMinWidth) {
    let headCanvas = this.timeHeadScroller.canvas
    let bodyCanvas = this.timeBodyScroller.canvas

    headCanvas.setWidth(containerWidth)
    headCanvas.setMinWidth(containerMinWidth)
    bodyCanvas.setWidth(containerWidth)
    bodyCanvas.setMinWidth(containerMinWidth)
  }


  setHeight(totalHeight, isAuto) {
    let timeHeadScroller = this.timeHeadScroller
    let timeBodyScroller = this.timeBodyScroller
    let spreadsheetHeadScroller = this.spreadsheetHeadScrollerRef.current
    let { spreadsheetBodyScroller } = this
    let bodyHeight

    if (isAuto) {
      bodyHeight = 'auto'
    } else {
      bodyHeight = totalHeight - this.queryNonBodyHeight()
    }

    timeBodyScroller.setHeight(bodyHeight)
    spreadsheetBodyScroller.setHeight(bodyHeight)

    // adjusts gutters and classNames
    timeHeadScroller.updateSize()
    spreadsheetHeadScroller.updateSize()
    timeBodyScroller.updateSize()
    spreadsheetBodyScroller.updateSize()

    this.updateScrollJoiners()
  }


  queryNonBodyHeight() {
    let rootEl = this.rootElRef.current
    let { spreadsheetBodyScroller } = this
    let timeBodyScroller = this.spreadsheetBodyScroller

    return rootEl.getBoundingClientRect().height - Math.max(
      spreadsheetBodyScroller.clipEl.getBoundingClientRect().height,
      timeBodyScroller.clipEl.getBoundingClientRect().height
    )
  }


  syncRowHeights() {
    this.headRowSyncer.sync([
      this.spreadsheetHeadScrollerRef.current.canvas.fgEl,
      this.timeHeadScrollerRef.current.canvas.fgEl
    ])

    this.bodyRowSyncer.sync([
      this.spreadsheetBodyScroller.canvas.fgEl,
      this.timeBodyScrollerRef.current.canvas.fgEl
    ])
  }


  updateScrollJoiners() {
    this.getBodyScrollJoiner({
      scrollers: [ this.spreadsheetBodyScroller, this.timeBodyScrollerRef.current ],
      axis: 'vertical'
    }).updateSize()

    this.getSpreadsheetScrollJoiner({
      scrollers: [ this.spreadsheetHeadScrollerRef.current , this.spreadsheetBodyScroller ],
      axis: 'horizontal'
    }).updateSize()

    this.getTimeScrollJoiner({
      scrollers: [ this.timeHeadScrollerRef.current, this.timeBodyScrollerRef.current ],
      axis: 'horizontal'
    }).updateSize()
  }


  updateStickyScrolling() {
    let timeHeadScroller = this.timeHeadScroller
    let timeBodyScroller = this.timeBodyScroller
    let spreadsheetHeadScroller = this.spreadsheetHeadScrollerRef.current
    let { spreadsheetBodyScroller } = this

    timeHeadScroller.enhancedScroller.updateStickyScrolling()
    timeBodyScroller.enhancedScroller.updateStickyScrolling()
    spreadsheetHeadScroller.enhancedScroller.updateStickyScrolling()
    spreadsheetBodyScroller.enhancedScroller.updateStickyScrolling()
  }


  _initSpreadsheetWidthResizing(props: { resizerEl: HTMLElement }, context: ComponentContext) {
    let { isRtl, pluginHooks } = context
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl
    let spreadsheetHeadEl = this.spreadsheetHeadElRef.current

    if (ElementDraggingImpl) {
      let dragging = new ElementDraggingImpl(props.resizerEl)
      let dragStartWidth
      let viewWidth

      dragging.emitter.on('dragstart', () => {
        dragStartWidth = this.spreadsheetWidth
        if (typeof dragStartWidth !== 'number') {
          dragStartWidth = spreadsheetHeadEl.getBoundingClientRect().width
        }
        viewWidth = this.rootElRef.current.getBoundingClientRect().width
      })

      dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
        let newWidth = dragStartWidth + pev.deltaX * (isRtl ? -1 : 1)
        newWidth = Math.max(newWidth, MIN_RESOURCE_AREA_WIDTH)
        newWidth = Math.min(newWidth, viewWidth - MIN_RESOURCE_AREA_WIDTH)
        this.setResourceAreaWidth(newWidth)
      })

      dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area

      return dragging
    }
  }


  _destroySpreadsheetWidthResizing(dragging: ElementDragging | void) {
    if (dragging) {
      dragging.destroy()
    }
  }


  setResourceAreaWidth(widthVal) {
    let spreadsheetHeadEl = this.spreadsheetHeadElRef.current

    this.spreadsheetWidth = widthVal
    applyStyleProp(spreadsheetHeadEl, 'width', widthVal || '')
  }

}
