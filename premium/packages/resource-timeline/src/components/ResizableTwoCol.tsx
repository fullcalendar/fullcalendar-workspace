import { CssDimValue } from '@fullcalendar/core'
import { BaseComponent, ElementDragging, PointerDragEvent, setRef, joinClassNames, memoize } from '@fullcalendar/core/internal'
import { ComponentChildren, Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { parseDimConfig, resizeDimConfig, serializeDimConfig } from '../col-positioning.js'

export interface ResizableTwoColProps {
  className?: string
  startContent: ComponentChildren
  startClassName?: string
  endContent: ComponentChildren
  endClassName?: string
  elRef?: Ref<HTMLDivElement>

  initialStartWidth: CssDimValue
  startWidthRef?: Ref<CssDimValue> // fires after drag end
}

interface ResizableTwoColState {
  widthOverride: { pixels: number, frac: number, min: number }
}

const MIN_RESOURCE_AREA_WIDTH = 30 // definitely bigger than scrollbars

export class ResizableTwoCol extends BaseComponent<ResizableTwoColProps, ResizableTwoColState> {
  // memo
  parseWidthConfig = memoize(parseDimConfig)

  // ref
  rootEl: null | HTMLDivElement = null
  startElRef = createRef<HTMLDivElement>()
  resizerElRef = createRef<HTMLDivElement>()

  // internal
  widthConfig?: { pixels: number, frac: number, min: number }
  resizerDragging: ElementDragging

  render() {
    const { props, state } = this

    const initialWidthConfig = this.parseWidthConfig(props.initialStartWidth, MIN_RESOURCE_AREA_WIDTH)
    const widthConfig = this.widthConfig = state.widthOverride || initialWidthConfig

    return (
      <div
        ref={this.handleRootEl}
        class={joinClassNames(props.className, 'fc-flex-row')}
      >
        <div
          class={props.startClassName}
          style={{
            width: serializeDimConfig(widthConfig),
          }}
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
    const ElementDraggingImpl = this.context.pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      let dragging = this.resizerDragging = new ElementDraggingImpl(this.resizerElRef.current)

      dragging.emitter.on('dragstart', () => {
        const viewWidth = this.rootEl.getBoundingClientRect().width
        const origWidth = this.startElRef.current.getBoundingClientRect().width
        const origWidthConfig = this.widthConfig
        let newWidthConfig: { pixels: number, frac: number, min: number } | undefined

        dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
          let newWidth = Math.min(
            origWidth + pev.deltaX * (this.context.isRtl ? -1 : 1),
            viewWidth,
          )
          newWidthConfig = resizeDimConfig(origWidthConfig, newWidth, viewWidth)

          this.setState({
            widthOverride: newWidthConfig,
          })
        })

        dragging.emitter.on('dragend', () => {
          if (newWidthConfig) {
            setRef(this.props.startWidthRef, serializeDimConfig(newWidthConfig))
          }
        })

        dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area
      })
    }

    setRef(this.props.startWidthRef, this.props.initialStartWidth)
  }

  componentWillUnmount() {
    if (this.resizerDragging) {
      this.resizerDragging.destroy()
    }
  }
}
