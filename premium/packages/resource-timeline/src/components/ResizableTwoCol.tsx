import { CssDimValue } from '@fullcalendar/core'
import { BaseComponent, ElementDragging, PointerDragEvent, setRef, joinClassNames } from '@fullcalendar/core/internal'
import { ComponentChildren, Ref, createElement, createRef } from '@fullcalendar/core/preact'

export interface ResizableTwoColProps {
  className?: string
  startContent: ComponentChildren
  startClassName?: string
  endContent: ComponentChildren
  endClassName?: string
  elRef?: Ref<HTMLDivElement>

  initialStartWidth: CssDimValue
  startWidthRef?: Ref<CssDimValue>
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
    const { props, state } = this
    const resourceAreaWidth = props.initialStartWidth ?? state.startWidthOverride

    return (
      <div
        ref={this.handleRootEl}
        class={joinClassNames(props.className, 'fc-flex-row')}
      >
        <div
          class={props.startClassName}
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
        <div class={joinClassNames(props.endClassName, 'fc-liquid')}>
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
    const { props, context } = this
    const { isRtl, pluginHooks } = context
    const ElementDraggingImpl = pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      let dragging = this.resizerDragging = new ElementDraggingImpl(this.resizerElRef.current)
      let dragStartWidth: number
      let viewWidth: number
      let newWidth: number | undefined

      dragging.emitter.on('dragstart', () => {
        viewWidth = this.rootEl.getBoundingClientRect().width
        dragStartWidth = this.startElRef.current.getBoundingClientRect().width
        newWidth = undefined
      })

      dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
        newWidth = dragStartWidth + pev.deltaX * (isRtl ? -1 : 1)
        newWidth = Math.max(newWidth, MIN_RESOURCE_AREA_WIDTH)
        newWidth = Math.min(newWidth, viewWidth - MIN_RESOURCE_AREA_WIDTH)

        this.setState({
          startWidthOverride: newWidth,
        })
      })

      dragging.emitter.on('dragend', () => {
        if (newWidth != null) {
          setRef(props.startWidthRef, newWidth)
        }
      })

      dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area
    }

    setRef(props.startWidthRef, props.initialStartWidth)
  }

  componentWillUnmount() {
    if (this.resizerDragging) {
      this.resizerDragging.destroy()
    }
  }
}
