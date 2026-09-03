import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, ContentContainer, generateClassName, setRef, watchHeight } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type ReactNode, createRef, type Ref } from 'react'
import { ColSpec, ResourceGroupHeaderInfo } from '../../structs'
import { type AriaCellInput, buildAriaCellAttrs } from '../../aria'

export interface ResourceGroupCellProps extends AriaCellInput {
  colSpec: ColSpec
  fieldValue: any
  rowSpan?: number
  borderStart: boolean
  borderBottom?: boolean
  innerHeightRef?: Ref<number>
  forPrint?: boolean
}

/*
Cell for a resource group that can span multiple logical rows.
*/
export class ResourceGroupCell extends BaseComponent<ResourceGroupCellProps> {
  private innerElRef = createRef<HTMLDivElement>()
  private _isUnmounting: boolean
  private disconnectInnerHeight?: () => void

  render() {
    const { props, context } = this
    const { colSpec, forPrint } = props
    const renderProps: ResourceGroupHeaderInfo = {
      fieldValue: props.fieldValue,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        tag={forPrint ? 'td' : 'div'}
        attrs={forPrint ? {
          rowSpan: props.rowSpan,
        } : {
          ...buildAriaCellAttrs(props),
          role: 'rowheader',
          'aria-rowspan': props.rowSpan,
        }}
        className={joinClassNames(
          classNames.noMargin,
          classNames.noPadding,
          !forPrint && classNames.flexCol,
          classNames.alignStart,
          !forPrint && classNames.liquid,
          forPrint && classNames.crop,
          forPrint && context.options.resourceRowClass,
          classNames.borderlessTop,
          classNames.borderlessEnd,
          !props.borderStart && classNames.borderlessStart,
          !props.borderBottom && classNames.borderlessBottom,
        )}
        renderProps={renderProps}
        generatorName="resourceCellContent"
        customGenerator={colSpec.cellContent}
        defaultGenerator={renderGroupInner}
        classNameGenerator={colSpec.cellClass}
        didMount={colSpec.cellDidMount}
        willUnmount={colSpec.cellWillUnmount}
      >
        {(InnerContent) => (
          <div
            ref={this.innerElRef}
            className={joinClassNames(
              classNames.noShrink,
              classNames.whiteSpaceNoWrap,
              classNames.flexRow,
              !forPrint && classNames.stickyT,
            )}
          >
            <InnerContent
              tag="div"
              className={generateClassName(colSpec.cellInnerClass, renderProps)}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    this._isUnmounting = false
    this.disconnectInnerHeight = watchHeight(this.innerElRef.current, (height) => {
      if (this._isUnmounting) {
        return
      }
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    this.disconnectInnerHeight?.()
    setRef(this.props.innerHeightRef, null)
  }
}

function renderGroupInner(renderProps: ResourceGroupHeaderInfo): ReactNode {
  return renderProps.fieldValue || <>&nbsp;</>
}
