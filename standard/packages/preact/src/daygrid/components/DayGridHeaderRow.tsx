import { afterSize } from '../../component-util/resize-observer'
import { setRef } from '../../vdom-util'
import { joinClassNames } from '../../util/html'
import { RefMap } from '../../util/RefMap'
import { createElement, memo, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { useViewContext } from '../../hooks/useViewContext'
import { useLatest } from '../../hooks/useLatest'
import { RowConfig } from '../header-tier'
import { DayGridHeaderCell } from './DayGridHeaderCell'
import classNames from '../../styles.module.css'

export interface DayGridHeaderRowProps<BaseRenderProps, RenderProps> extends RowConfig<BaseRenderProps, RenderProps> {
  cellIsNarrow: boolean
  cellIsMicro: boolean
  className?: string
  height?: number
  colWidth?: number
  viewportWidth?: number
  innerHeightRef?: Ref<number>
  role?: string
  rowIndex?: number // 0-based ... optional?... for aria only?
  rowLevel: number // 0 is closest to body, higher-up is ++
  borderBottom?: boolean
  tableMode?: boolean
}

function DayGridHeaderRowImpl<
  BaseRenderProps extends { isDisabled: boolean },
  RenderProps extends { text: string, isDisabled: boolean },
>(props: DayGridHeaderRowProps<BaseRenderProps, RenderProps>) {
  const { tableMode } = props
  const { options } = useViewContext()

  // reports the tallest cell's inner height to props.innerHeightRef
  const isActiveRef = useRef(false)
  const reportedHeightRef = useRef<number | undefined>(undefined)
  const innerHeightRefRef = useLatest(props.innerHeightRef)
  const [innerHeightRefMap] = useState(() => {
    const handleInnerHeights = () => {
      if (isActiveRef.current) {
        let max = 0

        for (const innerHeight of innerHeightRefMap.current.values()) {
          max = Math.max(max, innerHeight)
        }

        if (reportedHeightRef.current !== max) {
          reportedHeightRef.current = max
          setRef(innerHeightRefRef.current, max)
        }
      }
    }
    const innerHeightRefMap = new RefMap<string, number>(() => {
      afterSize(handleInnerHeights)
    })
    return innerHeightRefMap
  })

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
      reportedHeightRef.current = undefined
      setRef(innerHeightRefRef.current, null)
    }
  }, [])

  return createElement(
    tableMode ? 'tr' : 'div',
    {
      role: props.role as any, // !!!
      'aria-rowindex': props.rowIndex != null ? 1 + props.rowIndex : undefined,
      className: joinClassNames(
        options.dayHeaderRowClass,
        props.className,
        tableMode && classNames.borderless,
        !tableMode && classNames.flexRow,
        !tableMode && classNames.contentBox,
        !tableMode && classNames.borderlessX,
        !tableMode && classNames.borderlessTop,
        (!tableMode && !props.borderBottom) && classNames.borderlessBottom,
      ),
      style: {
        height: props.height,
      },
    },
    props.dataConfigs.map((dataConfig, cellI) => (
      <DayGridHeaderCell
        key={dataConfig.key}
        renderConfig={props.renderConfig}
        dataConfig={dataConfig}
        borderStart={Boolean(cellI)}
        colWidth={props.colWidth}
        viewportWidth={props.viewportWidth}
        innerHeightRef={innerHeightRefMap.createRef(dataConfig.key)}
        cellIsNarrow={props.cellIsNarrow}
        cellIsMicro={props.cellIsMicro}
        rowLevel={props.rowLevel}
        tableMode={tableMode}
        borderBottom={props.borderBottom}
      />
    )),
  )
}

export const DayGridHeaderRow = memo(DayGridHeaderRowImpl) as unknown as typeof DayGridHeaderRowImpl
