import { afterSize, BaseComponent, ElementDragging, PointerDragEvent, setRef, watchWidth } from '@fullcalendar/core/internal'
import { ComponentChildren, Ref, createElement, createRef } from '@fullcalendar/core/preact'

export interface ResizableTwoColProps {
  className?: string
  startContent: ComponentChildren
  startClassName?: string
  endContent: ComponentChildren
  endClassName?: string
  onSizes?: (startWidth: number, endWidth: number) => void
  elRef?: Ref<HTMLDivElement>
}

interface ResizableTwoColState {
  startWidthOverride: number | undefined
}

const MIN_RESOURCE_AREA_WIDTH = 30 // definitely bigger than scrollbars

export class ResizableTwoCol extends BaseComponent<ResizableTwoColProps, ResizableTwoColState> {
  rootEl: null | HTMLDivElement = null
  startElRef = createRef<HTMLDivElement>()
  endElRef = createRef<HTMLDivElement>()
  resizerElRef = createRef<HTMLDivElement>()

  // internal
  startWidth: number // weird names, might get confused with dragging start/end
  endWidth: number //
  resizerDragging: ElementDragging
  unwatchStartWidth?: () => void
  unwatchEndWidth?: () => void

  render() {
    let { props, state, context } = this
    let { options, theme } = context

    let resourceAreaWidth = state.startWidthOverride != null
      ? state.startWidthOverride
      : options.resourceAreaWidth

    return (
      <div
        ref={this.handleRootEl}
        class={[
          'fcnew-cellgroup',
          props.className,
        ].join(' ')}
      >
        <div
          class={[
            'fcnew-cell',
            props.startClassName
          ].join(' ')}
          style={{ width: resourceAreaWidth }}
          ref={this.startElRef}
        >
          {props.startContent}
        </div>
        <div
          className={[
            'fcnew-cell',
            'fcnew-resource-timeline-divider',
            theme.getClass('tableCellShaded'),
          ].join(' ')}
          ref={this.resizerElRef}
        />
        <div
          class={[
            'fcnew-cell',
            'fcnew-grow fcnew-basis0 fcnew-minw0',
            props.endClassName,
          ].join(' ')}
          ref={this.endElRef}
        >
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
    this.unwatchStartWidth = watchWidth(this.startElRef.current, (width) => {
      this.startWidth = width
      afterSize(this.fireSizing)
    })

    this.unwatchEndWidth = watchWidth(this.endElRef.current, (width) => {
      this.endWidth = width
      afterSize(this.fireSizing)
    })

    this.initResizing()
  }

  componentWillUnmount() {
    this.destroyResizing()
  }

  fireSizing = () => {
    if (this.props.onSizes) {
      this.props.onSizes(this.startWidth, this.endWidth)
    }
  }

  initResizing() {
    let { isRtl, pluginHooks } = this.context
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      let rootEl = this.rootEl
      let dragging = this.resizerDragging = new ElementDraggingImpl(this.resizerElRef.current)
      let dragStartWidth
      let viewWidth

      dragging.emitter.on('dragstart', () => {
        dragStartWidth = this.startWidth
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
