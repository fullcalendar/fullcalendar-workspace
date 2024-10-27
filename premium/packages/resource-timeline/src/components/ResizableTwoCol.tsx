import { BaseComponent, ElementDragging, PointerDragEvent, setRef, joinClassNames } from '@fullcalendar/core/internal'
import { ComponentChildren, Ref, createElement, createRef } from '@fullcalendar/core/preact'

export interface ResizableTwoColProps {
  className?: string
  startContent: ComponentChildren
  startClassName?: string
  endContent: ComponentChildren
  endClassName?: string
  elRef?: Ref<HTMLDivElement>
}

interface ResizableTwoColState {
  startWidthOverride: number | undefined
}

const MIN_RESOURCE_AREA_WIDTH = 30 // definitely bigger than scrollbars

export class ResizableTwoCol extends BaseComponent<ResizableTwoColProps, ResizableTwoColState> {
  rootEl: null | HTMLDivElement = null
  startElRef = createRef<HTMLDivElement>()
  resizerElRef = createRef<HTMLDivElement>()

  // internal
  startWidth: number // weird names, might get confused with dragging start/end
  endWidth: number //
  resizerDragging: ElementDragging

  render() {
    let { props, state, context } = this
    let { options } = context

    let resourceAreaWidth = state.startWidthOverride != null
      ? state.startWidthOverride
      : options.resourceAreaWidth

    return (
      <div
        ref={this.handleRootEl}
        class={joinClassNames(props.className, 'fc-flex-row')}
      >
        <div
          class={joinClassNames(props.startClassName, 'fc-cell')}
          style={{ width: resourceAreaWidth }}
          ref={this.startElRef}
        >
          {props.startContent}
        </div>
        <div
          className='fc-celldivider'
          // TODO: make a className somehow?...
          // TODO: what if not resizable?
          style={{ cursor: 'col-resize' }}
          ref={this.resizerElRef}
        />
        <div class={joinClassNames(props.endClassName, 'fc-cell fc-liquid')}>
          {props.endContent}
        </div>
      </div>
    )
  }

  handleRootEl = (el: HTMLDivElement | null) => {
    this.rootEl = el

    if (this.props.elRef) {
      setRef(this.props.elRef, el)
    }
  }

  componentDidMount() {
    let { isRtl, pluginHooks } = this.context
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      let dragging = this.resizerDragging = new ElementDraggingImpl(this.resizerElRef.current)
      let dragStartWidth: number
      let viewWidth: number

      dragging.emitter.on('dragstart', () => {
        viewWidth = this.rootEl.getBoundingClientRect().width
        dragStartWidth = this.startElRef.current.getBoundingClientRect().width
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

  componentWillUnmount() {
    if (this.resizerDragging) {
      this.resizerDragging.destroy()
    }
  }
}
