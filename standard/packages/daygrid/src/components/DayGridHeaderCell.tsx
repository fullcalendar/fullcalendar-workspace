import { ContentContainer, joinClassNames, watchHeight, setRef, renderText, BaseComponent, generateClassName } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { CellDataConfig, CellRenderConfig } from '../header-tier.js'
import { narrowDayHeaderFormat } from './util.js'
import classNames from '@fullcalendar/core/internal-classnames'

export interface DayGridHeaderCellProps<RenderProps> {
  renderConfig: CellRenderConfig<RenderProps>
  dataConfig: CellDataConfig<RenderProps>
  isSticky?: boolean
  borderStart: boolean
  colWidth?: number
  innerHeightRef?: Ref<number>
  cellIsCompact: boolean
  cellIsNarrow: boolean // even smaller than "compact"
}

export class DayGridHeaderCell<RenderProps extends { text: string, isDisabled: boolean }> extends BaseComponent<DayGridHeaderCellProps<RenderProps>> {
  // internal
  private disconectInnerHeight?: () => void

  render() {
    const { props, context } = this
    const { renderConfig, dataConfig } = props

    // HACK
    const isDisabled = dataConfig.renderProps.isDisabled
    const finalRenderProps = {
      ...dataConfig.renderProps,
      isCompact: props.cellIsCompact,
    }
    if (props.cellIsNarrow) {
      // TODO: only if not distinct dates
      finalRenderProps.text = (finalRenderProps as any).weekdayText =
        context.dateEnv.format(dataConfig.dateMarker, narrowDayHeaderFormat)[0]
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
          !props.isSticky && classNames.crop,
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
            attrs={dataConfig.innerAttrs}
            className={joinClassNames(
              generateClassName(renderConfig.innerClassNameGenerator, finalRenderProps),
              classNames.rigid,
              props.isSticky && classNames.stickyS,
            )}
            elRef={this.handleInnerEl}
          />
        )}
      </ContentContainer>
    )
  }

  handleInnerEl = (innerEl: HTMLElement | null) => {
    if (this.disconectInnerHeight) {
      this.disconectInnerHeight()
      this.disconectInnerHeight = undefined
    }
    if (innerEl) {
      this.disconectInnerHeight = watchHeight(innerEl, (height) => {
        setRef(this.props.innerHeightRef, height)
      })
    } else {
      setRef(this.props.innerHeightRef, null)
    }
  }
}
