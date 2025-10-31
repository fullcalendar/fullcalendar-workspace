import { afterSize, BaseComponent, joinArrayishClassNames, RefMap, setRef } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { RowConfig } from '../header-tier.js'
import { DayGridHeaderCell } from './DayGridHeaderCell.js'
import classNames from '@fullcalendar/core/internal-classnames'

export interface DayGridHeaderRowProps<RenderProps> extends RowConfig<RenderProps> {
  cellIsNarrow: boolean
  cellIsSuperNarrow: boolean
  className?: string
  height?: number
  colWidth?: number
  innerHeightRef?: Ref<number>
  role?: string
  rowIndex?: number // 0-based ... optional?... for aria only?
  rowLevel: number // 0 is closest to body, higher-up is ++
  borderBottom?: boolean
}

export class DayGridHeaderRow<RenderProps extends { text: string, isDisabled: boolean }> extends BaseComponent<DayGridHeaderRowProps<RenderProps>> {
  // ref
  private innerHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleInnerHeights)
  })

  // internal
  private currentInnerHeight?: number

  render() {
    const { props, context } = this
    const { options } = context

    return (
      <div
        role={props.role as any /* !!! */}
        aria-rowindex={props.rowIndex != null ? 1 + props.rowIndex : undefined}
        className={joinArrayishClassNames(
          options.dayHeaderRowClass,
          props.className,
          classNames.flexRow,
          classNames.contentBox,
          props.borderBottom ? classNames.borderOnlyB : classNames.borderNone,
        )}
        style={{
          height: props.height,
        }}
      >
        {props.dataConfigs.map((dataConfig, cellI) => (
          <DayGridHeaderCell
            key={dataConfig.key}
            renderConfig={props.renderConfig}
            dataConfig={dataConfig}
            borderStart={Boolean(cellI)}
            colWidth={props.colWidth}
            innerHeightRef={this.innerHeightRefMap.createRef(dataConfig.key)}
            cellIsNarrow={props.cellIsNarrow}
            cellIsSuperNarrow={props.cellIsSuperNarrow}
            rowLevel={props.rowLevel}
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

  componentWillUnmount(): void {
    setRef(this.props.innerHeightRef, null)
  }
}
