import { ContentContainer, joinClassNames, watchHeight, setRef, renderText, BaseComponent, generateClassName } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { CellDataConfig, CellRenderConfig } from '../header-tier.js'
import classNames from '@fullcalendar/core/internal-classnames'

export interface DayGridHeaderCellProps<RenderProps> {
  renderConfig: CellRenderConfig<RenderProps>
  dataConfig: CellDataConfig<RenderProps>
  isSticky?: boolean
  borderStart: boolean
  colWidth?: number
  innerHeightRef?: Ref<number>
}

export class DayGridHeaderCell<RenderProps extends { text: string, isDisabled: boolean }> extends BaseComponent<DayGridHeaderCellProps<RenderProps>> {
  // internal
  private disconectInnerHeight?: () => void

  render() {
    const { props } = this
    const { renderConfig, dataConfig } = props

    // HACK
    const isDisabled = dataConfig.renderProps.isDisabled

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
          classNames.redBgColor,
          'fcu-tight fcu-flex-col fcu-align-center',
          props.borderStart ? 'fcu-border-only-s' : 'fcu-border-none',
          !props.isSticky && 'fcu-crop',
          props.colWidth == null && 'fcu-liquid',
        )}
        style={{
          width: props.colWidth != null
            ? props.colWidth * (dataConfig.colSpan || 1)
            : undefined,
        }}
        renderProps={dataConfig.renderProps}
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
              generateClassName(renderConfig.innerClassNameGenerator, dataConfig.renderProps),
              'fcu-rigid fcu-flex-col',
              props.isSticky && 'fcu-sticky-s',
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
