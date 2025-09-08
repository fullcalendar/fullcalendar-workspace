import { ContentContainer, joinClassNames, setRef, renderText, BaseComponent, generateClassName, watchSize } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { CellDataConfig, CellRenderConfig } from '../header-tier.js'
import { narrowDayHeaderFormat } from './util.js'
import classNames from '@fullcalendar/core/internal-classnames'

export interface DayGridHeaderCellProps<RenderProps> {
  renderConfig: CellRenderConfig<RenderProps>
  dataConfig: CellDataConfig<RenderProps>
  borderStart: boolean
  colWidth?: number
  innerHeightRef?: Ref<number>
  cellIsCompact: boolean
  cellIsNarrow: boolean // even smaller than "compact"
  rowLevel: number
}

interface DayGridHeaderCellState {
  innerWidth?: number
}

export class DayGridHeaderCell<RenderProps extends { text: string, isDisabled: boolean }> extends BaseComponent<DayGridHeaderCellProps<RenderProps>, DayGridHeaderCellState> {
  // internal
  private disconnectSize?: () => void
  private align?: 'start' | 'center' | 'end'
  private isSticky?: boolean

  render() {
    const { props, state, context } = this
    const { renderConfig, dataConfig } = props

    // HACK
    const isDisabled = dataConfig.renderProps.isDisabled
    const finalRenderProps = {
      ...dataConfig.renderProps,
      isCompact: props.cellIsCompact,
      level: props.rowLevel,
    }
    if (props.cellIsNarrow) {
      // TODO: only if not distinct dates
      const [narrowText, narrowTextParts] = context.dateEnv.format(dataConfig.dateMarker, narrowDayHeaderFormat)
      finalRenderProps.text = (finalRenderProps as any).weekdayText = narrowText
      ;(finalRenderProps as any).textParts = narrowTextParts
    }

    /*
    TODO: DRY with TimelineHeaderCell
    */
    const alignInput = renderConfig.align
    const align = this.align =
      typeof alignInput === 'function'
        ? alignInput({ level: props.rowLevel, inPopover: (dataConfig.renderProps as any).inPopover })
        : alignInput
    const stickyInput = renderConfig.sticky
    const isSticky = this.isSticky =
      props.rowLevel && stickyInput !== false
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
          <InnerContainer
            tag='div'
            elRef={this.handleInnerEl}
            attrs={dataConfig.innerAttrs}
            className={joinClassNames(
              generateClassName(renderConfig.innerClassNameGenerator, finalRenderProps),
              classNames.rigid,
              isSticky && classNames.sticky,
            )}
            style={{
              left: edgeCoord,
              right: edgeCoord,
            }}
          />
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
        setRef(this.props.innerHeightRef, height)

        /*
        TODO: DRY with TimelineHeaderCell
        */
        if (this.align === 'center' && this.isSticky) {
          this.setState({ innerWidth: width })
        }
      })
    } else {
      setRef(this.props.innerHeightRef, null)
    }
  }
}
