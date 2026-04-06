import { joinClassNames } from '../../util/html'
import { ContentContainer, renderText, generateClassName } from '../../content-inject/ContentContainer'
import { setRef } from '../../vdom-util'
import { BaseComponent } from '../../vdom-util'
import { watchSize } from '../../component-util/resize-observer'
import type { Ref } from 'react'
import { CellDataConfig, CellRenderConfig } from '../header-tier'
import { dayHeaderMicroFormat } from './util'
import classNames from '../../styles.module.css'
import { joinDateTimeFormatParts } from '@full-ui/headless-calendar'

export interface DayGridHeaderCellProps<RenderProps> {
  renderConfig: CellRenderConfig<RenderProps>
  dataConfig: CellDataConfig<RenderProps>
  borderStart: boolean
  colWidth?: number
  innerHeightRef?: Ref<number>
  cellIsNarrow: boolean
  cellIsMicro: boolean
  rowLevel: number
  stickyInner?: boolean
}

interface DayGridHeaderCellState {
  innerWidth?: number
}

export class DayGridHeaderCell<RenderProps extends { text: string, isDisabled: boolean }> extends BaseComponent<DayGridHeaderCellProps<RenderProps>, DayGridHeaderCellState> {
  state = {} as DayGridHeaderCellState

  // internal
  private _isUnmounting: boolean
  private disconnectSize?: () => void

  render() {
    const { props, state, context } = this
    const { renderConfig, dataConfig } = props

    // HACK
    const isDisabled = dataConfig.renderProps.isDisabled
    const finalRenderProps = {
      ...dataConfig.renderProps,
      isNarrow: props.cellIsNarrow,
      level: props.rowLevel,
    }
    if (props.cellIsMicro) {
      // TODO: only if not distinct dates
      const microTextParts = context.dateEnv.formatToParts(dataConfig.dateMarker, dayHeaderMicroFormat)
      const microText = joinDateTimeFormatParts(microTextParts)
      finalRenderProps.text = (finalRenderProps as any).weekdayText = microText
      ;(finalRenderProps as any).textParts = microTextParts
    }

    /*
    TODO: DRY with TimelineHeaderCell
    */
    const alignInput = renderConfig.align
    const align =
      typeof alignInput === 'function'
        ? alignInput({ level: props.rowLevel, inPopover: (dataConfig.renderProps as any).inPopover, isNarrow: props.cellIsNarrow })
        : alignInput
    const stickyInput = renderConfig.sticky
    const isSticky = props.rowLevel > 0 && stickyInput !== false && props.stickyInner
    let edgeCoord: number | string | undefined
    if (isSticky) {
      if (align === 'center') {
        if (state.innerWidth != null) {
          edgeCoord = `calc(50% - ${state.innerWidth / 2}px)`
        }
      } else {
        edgeCoord = (
          typeof stickyInput === 'number' ||
          typeof stickyInput === 'string'
        ) ? stickyInput: 0
      }
    }

    return (
      <ContentContainer
        tag='div'
        attrs={{
          role: 'columnheader',
          'aria-colspan': dataConfig.colSpan,
          ...dataConfig.attrs,
        }}
        className={joinClassNames(
          dataConfig.className,
          classNames.tight,
          classNames.flexCol,
          props.borderStart ? classNames.borderOnlyS : classNames.borderNone,
          align === 'center' ? classNames.alignCenter :
            align === 'end' ? classNames.alignEnd :
              classNames.alignStart,
          props.colWidth == null && classNames.liquid,
          !isSticky && classNames.crop,
        )}
        style={{
          width: props.colWidth != null
            ? props.colWidth * (dataConfig.colSpan || 1)
            : undefined,
        }}
        renderProps={finalRenderProps}
        generatorName={renderConfig.generatorName}
        customGenerator={renderConfig.customGenerator}
        defaultGenerator={renderText}
        classNameGenerator={
          // don't use custom classNames if disabled
          // TODO: make DRY with DayCellContainer
          isDisabled ? undefined : renderConfig.classNameGenerator
        }
        didMount={renderConfig.didMount}
        willUnmount={renderConfig.willUnmount}
      >
        {(InnerContainer) => (
          <div
            ref={this.handleInnerEl}
            className={joinClassNames(
              classNames.flexCol,
              classNames.rigid,
              isSticky && classNames.sticky,
            )}
            style={{
              left: edgeCoord,
              right: edgeCoord,
            }}
          >
            <InnerContainer
              tag='div'
              attrs={dataConfig.innerAttrs}
              className={generateClassName(renderConfig.innerClassNameGenerator, finalRenderProps)}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  handleInnerEl = (innerEl: HTMLElement | null) => {
    if (this.disconnectSize) {
      this.disconnectSize()
      this.disconnectSize = undefined
    }
    if (innerEl) {
      this.disconnectSize = watchSize(innerEl, (width, height) => {
        if (this._isUnmounting) return
        setRef(this.props.innerHeightRef, height)
        this.setState({ innerWidth: width })
      })
    } else {
      setRef(this.props.innerHeightRef, null)
    }
  }

  componentDidMount(): void {
    this._isUnmounting = false
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
  }
}
