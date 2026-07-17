import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, ContentContainer, generateClassName, setRef, watchHeight } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { createRef, type Ref } from 'react'
import { ResourceColumnHeaderInfo, ColHeaderRenderHooks } from '../../structs'
import { ResourceIndent } from './ResourceIndent'
import { type AriaCellInput, buildAriaCellAttrs } from '../../aria'

export interface SuperHeaderCellProps extends AriaCellInput {
  renderHooks: ColHeaderRenderHooks
  indent?: boolean
  indentWidth: number | undefined
  colSpan: number

  // refs
  innerHeightRef?: Ref<number>
}

/*
TODO: make more DRY with HeaderCell. Almost exactly the same except doesn't need resizer
*/
export class SuperHeaderCell extends BaseComponent<SuperHeaderCellProps> {
  // refs
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private _isUnmounting: boolean
  private disconnectInnerHeight?: () => void

  render() {
    let { renderHooks } = this.props
    let renderProps: ResourceColumnHeaderInfo = { view: this.context.viewApi }

    return (
      <ContentContainer
        tag="div"
        attrs={{
          ...buildAriaCellAttrs(this.props),
          role: 'columnheader',
          'aria-colspan': this.props.colSpan,
        }}
        className={joinClassNames(
          classNames.liquid,
          classNames.noMargin,
          classNames.noPadding,
          classNames.flexCol,
          classNames.alignStart,
          classNames.borderNone,
          classNames.crop,
        )}
        renderProps={renderProps}
        generatorName="resourceColumnHeaderContent"
        customGenerator={renderHooks.headerContent}
        defaultGenerator={renderHooks.headerDefault}
        classNameGenerator={renderHooks.headerClass}
        didMount={renderHooks.headerDidMount}
        willUnmount={renderHooks.headerWillUnmount}
      >
        {(InnerContent) => (
          <div
            ref={this.innerElRef}
            className={joinClassNames(
              classNames.noShrink,
              classNames.whiteSpaceNoWrap,
              classNames.flexRow,
            )}
          >
            {this.props.indent && (
              <ResourceIndent
                level={1}
                indentWidth={this.props.indentWidth}
              />
            )}
            <InnerContent
              tag='div'
              className={generateClassName(renderHooks.headerInnerClass, renderProps)}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    this._isUnmounting = false
    const innerEl = this.innerElRef.current

    this.disconnectInnerHeight = watchHeight(innerEl, (height) => {
      if (this._isUnmounting) return
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    this.disconnectInnerHeight()
    setRef(this.props.innerHeightRef, null)
  }
}
