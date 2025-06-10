import { BaseComponent, ContentContainer, generateClassName, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { ResourceColumnHeaderData, ColHeaderRenderHooks } from '../../structs.js'
import { ResourceIndent } from './ResourceIndent.js'

export interface SuperHeaderCellProps {
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
  private disconnectInnerHeight?: () => void

  render() {
    let { renderHooks } = this.props
    let renderProps: ResourceColumnHeaderData = { view: this.context.viewApi }

    return (
      <ContentContainer
        tag="div"
        attrs={{
          role: 'columnheader',
          'aria-colspan': this.props.colSpan,
        }}
        className={joinClassNames(
          classNames.tight,
          classNames.borderNone,
          classNames.flexCol,
          classNames.liquid,
        )}
        renderProps={renderProps}
        generatorName="resourceAreaHeaderContent"
        customGenerator={renderHooks.headerContent}
        defaultGenerator={renderHooks.headerDefault}
        classNameGenerator={renderHooks.headerClassNames}
        didMount={renderHooks.headerDidMount}
        willUnmount={renderHooks.headerWillUnmount}
      >
        {(InnerContent) => (
          <div
            ref={this.innerElRef}
            className={joinClassNames(
              generateClassName(renderHooks.headerInnerClassNames, renderProps),
              classNames.rigid,
              classNames.flexRow,
              classNames.alignCenter,
            )}
          >
            {this.props.indent && (
              <ResourceIndent
                level={1}
                indentWidth={this.props.indentWidth}
              />
            )}
            <InnerContent tag="div" />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current

    this.disconnectInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconnectInnerHeight()
    setRef(this.props.innerHeightRef, null)
  }
}
