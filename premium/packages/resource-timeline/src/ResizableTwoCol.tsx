import { BaseComponent, ElementDragging, PointerDragEvent } from '@fullcalendar/core/internal';
import { ComponentChildren, createElement, createRef } from '@fullcalendar/core/preact';

export interface ResizableTwoColProps {
  className?: string
  startContent: ComponentChildren
  startClassName?: string
  endContent: ComponentChildren
  endClassName?: string
  onSizes?: (startWidth: number, endWidth: number) => void
}

interface ResizableTwoColState {
  startWidthOverride: number | undefined
}

const MIN_RESOURCE_AREA_WIDTH = 30 // definitely bigger than scrollbars

export class ResizableTwoCol extends BaseComponent<ResizableTwoColProps, ResizableTwoColState> {
  rootElRef = createRef<HTMLDivElement>()
  resizerElRef = createRef<HTMLDivElement>()
  resizerDragging: ElementDragging

  render() {
    let { props, state, context } = this
    let { options, theme } = context

    let resourceAreaWidth = state.startWidthOverride != null
      ? state.startWidthOverride
      : options.resourceAreaWidth

    return (
      <div
        ref={this.rootElRef}
        class={props.className}
      >
        <div style={{ width: resourceAreaWidth }} class={props.startClassName}>
          {props.startContent}
        </div>
        <div
          ref={this.resizerElRef}
          className={'fc-resource-timeline-divider ' + theme.getClass('tableCellShaded')}
        />
        <div class={props.endClassName}>
          {props.endContent}
        </div>
      </div>
    )
  }

  componentDidMount() {
    this.initResizing()
  }

  componentWillUnmount() {
    this.destroyResizing()
  }

  initResizing() {
    let { isRtl, pluginHooks } = this.context
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl
    let resizerEl = this.resizerElRef.current

    if (ElementDraggingImpl) {
      let rootEl = this.rootElRef.current
      let dragging = this.resizerDragging = new ElementDraggingImpl(resizerEl)
      let dragStartWidth
      let viewWidth

      dragging.emitter.on('dragstart', () => {
        dragStartWidth = resizerEl.getBoundingClientRect().width
        viewWidth = rootEl.getBoundingClientRect().width
      })

      dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
        let newWidth = dragStartWidth + pev.deltaX * (isRtl ? -1 : 1)
        newWidth = Math.max(newWidth, MIN_RESOURCE_AREA_WIDTH)
        newWidth = Math.min(newWidth, viewWidth - MIN_RESOURCE_AREA_WIDTH)

        this.setState({
          startWidthOverride: newWidth,
        })
      })

      dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area
    }
  }

  destroyResizing() {
    if (this.resizerDragging) {
      this.resizerDragging.destroy()
    }
  }
}
