import { afterSize, BaseComponent, joinClassNames, RefMap, setRef } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { RowConfig } from '../header-tier.js'
import { DayGridHeaderCell } from './DayGridHeaderCell.js'

export interface DayGridHeaderRowProps<RenderProps> extends RowConfig<RenderProps> {
  isSticky?: boolean
  className?: string
  height?: number
  colWidth?: number
  innerHeightRef?: Ref<number>
}

export class DayGridHeaderRow<RenderProps extends { text: string, isDisabled: boolean }> extends BaseComponent<DayGridHeaderRowProps<RenderProps>> {
  // ref
  private innerHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleInnerHeights)
  })

  // internal
  private currentInnerHeight?: number

  render() {
    const { props } = this
    return (
      <div
        role='row'
        className={joinClassNames(
          'fc-flex-row fc-content-box',
          props.className,
        )}
        style={{ height: props.height }}
      >
        {props.dataConfigs.map((dataConfig, cellI) => (
          <DayGridHeaderCell
            key={dataConfig.key}
            renderConfig={props.renderConfig}
            dataConfig={dataConfig}
            isSticky={props.isSticky}
            borderStart={Boolean(cellI)}
            colWidth={props.colWidth}
            innerHeightRef={props.innerHeightRef}
          />
        ))}
      </div>
    )
  }

  private handleInnerHeights = () => {
    const innerHeightMap = this.innerHeightRefMap.current
    let max = 0

    for (const innerHeight of innerHeightMap.values()) {
      max = Math.max(max, innerHeight)
    }

    if (this.currentInnerHeight !== max) {
      this.currentInnerHeight = max
      setRef(this.props.innerHeightRef, max)
    }
  }
}