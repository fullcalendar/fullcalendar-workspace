import { joinClassNames } from '@fullcalendar/preact/public-api'
import { PointerDragEvent, computeElIsRtl, setRef, useForwardedElRef, useLatest, useViewContext } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { memo, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { DimConfig, resizeDimConfig, serializeDimConfig } from '@full-ui/headless-grid'

export interface ResizableTwoColProps {
  className?: string
  startContent: ReactNode
  startClassName?: string
  endContent: ReactNode
  endClassName?: string
  elRef?: Ref<HTMLDivElement>

  initialStartWidthConfig: DimConfig
  resizedWidthConfigRef?: Ref<DimConfig> // fires after drag end
}

export const ResizableTwoCol = memo(function ResizableTwoCol(props: ResizableTwoColProps) {
  const { options, pluginHooks } = useViewContext()
  const [widthOverride, setWidthOverride] = useState<DimConfig | undefined>(undefined)
  const widthConfig = widthOverride || props.initialStartWidthConfig

  const [rootElRef, handleRootEl] = useForwardedElRef(props.elRef as Ref<HTMLElement>)
  const startElRef = useRef<HTMLDivElement | null>(null)
  const resizerElRef = useRef<HTMLDivElement | null>(null)
  const latestRef = useLatest({ widthConfig, resizedWidthConfigRef: props.resizedWidthConfigRef })

  // dragging the divider resizes the start column
  useLayoutEffect(() => {
    const ElementDraggingImpl = pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      const resizerEl = resizerElRef.current
      const dragging = new ElementDraggingImpl(resizerEl)
      let isRtl: boolean
      let viewWidth: number
      let origWidth: number
      let origWidthConfig: DimConfig
      let newWidthConfig: DimConfig | undefined

      dragging.emitter.on('dragstart', () => {
        isRtl = computeElIsRtl(resizerEl)
        viewWidth = rootElRef.current.getBoundingClientRect().width
        origWidth = startElRef.current.getBoundingClientRect().width
        origWidthConfig = latestRef.current.widthConfig
        newWidthConfig = undefined

        dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area
      })

      dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
        const newWidth = Math.min(
          origWidth + pev.deltaX * (isRtl ? -1 : 1),
          viewWidth,
        )
        newWidthConfig = resizeDimConfig(origWidthConfig, newWidth, viewWidth)
        setWidthOverride(newWidthConfig)
      })

      dragging.emitter.on('dragend', () => {
        if (newWidthConfig) {
          setRef(latestRef.current.resizedWidthConfigRef, newWidthConfig)
        }
      })

      return () => {
        dragging.destroy()
      }
    }
  }, [])

  return (
    <div
      ref={handleRootEl}
      className={joinClassNames(props.className, classNames.flexRow)}
    >
      <div
        className={props.startClassName}
        style={{
          width: serializeDimConfig(widthConfig),
        }}
        ref={startElRef}
      >
        {props.startContent}
      </div>
      <div
        className={joinClassNames(
          options.resourceColumnDividerClass,
          classNames.rel, // for hitX
        )}
        // TODO: make a className somehow?...
        // TODO: what if not resizable?
        style={{ cursor: 'col-resize' }}
        ref={resizerElRef}
      >
        <div className={joinClassNames(classNames.hitXSkinny, classNames.z1)} />
      </div>
      <div className={joinClassNames(props.endClassName, classNames.liquid)}>
        {props.endContent}
      </div>
    </div>
  )
})
