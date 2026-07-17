import { createRef, type Ref } from 'react'
import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, ContentContainer, generateClassName, setRef, watchHeight } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { ColSpec, ResourceColumnHeaderInfo } from '../../structs'
import { ResourceIndent } from './ResourceIndent'

export interface HeaderCellProps {
  id?: string
  colSpec: ColSpec
  resizer: boolean
  indent?: boolean
  borderStart: boolean

  // refs
  resizerElRef?: Ref<HTMLDivElement>
  innerHeightRef?: Ref<number>

  // size
  width: number | undefined
  indentWidth: number | undefined
  grow: number | undefined
}

export class HeaderCell extends BaseComponent<HeaderCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private _isUnmounting: boolean
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { colSpec } = props
    let renderProps: ResourceColumnHeaderInfo = { view: context.viewApi }

    // need empty inner div for abs positioning for resizer
    return (
      <ContentContainer
        tag="div"
        attrs={{
          id: props.id,
          role: 'columnheader',
        }}
        className={joinClassNames(
          classNames.noMargin,
          classNames.noPadding,
          classNames.flexCol,
          props.borderStart ? classNames.borderOnlyS : classNames.borderNone,
          classNames.rel, // for resizer abs positioning
          // cannot crop because resizer is allowed to bleed out
        )}
        style={{
          minWidth: 0,
          width: props.width,
          flexGrow: props.grow,
        }}
        renderProps={renderProps}
        generatorName="resourceColumnHeaderContent"
        customGenerator={colSpec.headerContent}
        defaultGenerator={colSpec.headerDefault}
        classNameGenerator={colSpec.headerClass}
        didMount={colSpec.headerDidMount}
        willUnmount={colSpec.headerWillUnmount}
      >
        {(InnerContent) => (
          <>
            <div
              className={joinClassNames(
                classNames.crop, // must crop instead of outer
                classNames.flexCol,
                classNames.alignStart,
              )}
            >
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
                    indentWidth={props.indentWidth}
                  />
                )}
                <InnerContent
                  tag='div'
                  className={generateClassName(colSpec.headerInnerClass, renderProps)}
                />
              </div>
            </div>
            {props.resizer && (
              <div
                ref={props.resizerElRef}
                className={joinClassNames(
                  generateClassName(colSpec.headerResizerClass, renderProps),
                  classNames.z1,
                  classNames.cursorColResizer,
                )}
              />
            )}
          </>
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
