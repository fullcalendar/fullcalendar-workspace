import { ContentContainer, joinClassNames, watchHeight, setRef, renderText, BaseComponent } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { CellDataConfig, CellRenderConfig } from '../header-tier.js'

export interface DayGridHeaderCellProps<RenderProps> {
  renderConfig: CellRenderConfig<RenderProps>
  dataConfig: CellDataConfig<RenderProps>
  isSticky?: boolean
  borderStart: boolean
  colWidth?: number
  innerHeightRef?: Ref<number>
}

export class DayGridHeaderCell<RenderProps extends { text: string }> extends BaseComponent<DayGridHeaderCellProps<RenderProps>> {
  // internal
  private disconectInnerHeight?: () => void

  render() {
    const { props } = this
    const { renderConfig, dataConfig } = props

    return (
      <ContentContainer
        tag='div'
        attrs={dataConfig.attrs}
        className={joinClassNames(
          dataConfig.className,
          'fc-header-cell fc-cell fc-flex-col fc-align-center',
          props.borderStart && 'fc-border-s',
          !props.isSticky && 'fc-crop',
          props.colWidth == null && 'fc-liquid'
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
          dataConfig.isDisabled ? undefined : renderConfig.classNameGenerator
        }
        didMount={renderConfig.didMount}
        willUnmount={renderConfig.willUnmount}
      >
        {(InnerContainer) => (
          !dataConfig.isDisabled && (
            <InnerContainer
              tag={dataConfig.isNavLink ? 'a' : 'div'}
              attrs={dataConfig.innerAttrs}
              className={joinClassNames(
                'fc-cell-inner fc-flex-col fc-padding-sm',
                props.isSticky && 'fc-sticky-s'
              )}
              elRef={this.handleInnerEl} />
          )
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
