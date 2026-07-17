import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, ViewContext, ContentContainer, watchHeight, setRef, generateClassName } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type ReactNode, type Ref, createRef } from 'react'
import { Group, createGroupId, isGroupsEqual } from '../../../resource/common/resource-hierarchy'
import { ResourceIndent } from './ResourceIndent'
import { ResourceExpander } from './ResourceExpander'
import { ResourceGroupHeaderInfo, GroupSpec } from '../../structs'

export interface ResourceGroupHeaderSubrowProps {
  cellId?: string
  group: Group
  isExpanded: boolean // for aria
  colSpan: number // for aria
  borderBottom: boolean
  className?: string // not ultimately user-supplied. internally-supplied
  indentWidth: number | undefined

  // refs
  innerHeightRef?: Ref<number>

  // position
  height?: number // does NOT include the border
}

/*
Group cell that spans horizontally, consuming multiple colspans
*/
export class ResourceGroupHeaderSubrow extends BaseComponent<ResourceGroupHeaderSubrowProps, ViewContext> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private _isUnmounting: boolean
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let renderProps: ResourceGroupHeaderInfo = {
      fieldValue: props.group.value,
      view: context.viewApi,
    }
    let spec = props.group.spec as GroupSpec // type HACK

    return (
      <ContentContainer
        tag="div"
        attrs={{
          id: props.cellId,
          role: 'rowheader',
          'aria-colspan': props.colSpan,
          'aria-expanded': props.isExpanded,
        }}
        className={joinClassNames(
          classNames.liquid, // expand to whole row
          classNames.noMargin,
          classNames.noPadding,
          classNames.flexCol,
          classNames.alignStart, // h-align
          classNames.crop,
          classNames.contentBox,
          props.borderBottom ? classNames.borderOnlyB : classNames.borderNone,
        )}
        style={{
          height: props.height,
        }}
        renderProps={renderProps}
        generatorName="resourceGroupHeaderContent"
        customGenerator={spec.labelContent}
        defaultGenerator={renderCellInner}
        classNameGenerator={spec.labelClass}
        didMount={spec.labelDidMount}
        willUnmount={spec.labelWillUnmount}
      >
        {(InnerContent) => (
          <div
            ref={this.innerElRef}
            className={joinClassNames(
              classNames.noShrink,
              classNames.whiteSpaceNoWrap,
              classNames.flexRow,
            )}
            style={{
              isolation: 'isolate', // TODO: className
            }}
          >
            <ResourceIndent
              level={1}
              indentWidth={props.indentWidth}
              style={{ zIndex: 2 }}
            >
              <ResourceExpander
                isExpanded={props.isExpanded}
                onExpanderClick={this.onExpanderClick}
              />
            </ResourceIndent>
            <InnerContent
              tag='div'
              className={generateClassName(spec.labelInnerClass, renderProps)}
              style={{ zIndex: 1 }}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  onExpanderClick = () => {
    let { props } = this

    this.context.dispatch({
      type: 'SET_RESOURCE_ENTITY_EXPANDED',
      id: createGroupId(props.group),
      isExpanded: !props.isExpanded,
    })
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

ResourceGroupHeaderSubrow.addPropsEquality({
  group: isGroupsEqual,
})

function renderCellInner(renderProps: ResourceGroupHeaderInfo): ReactNode {
  return renderProps.fieldValue || <>&nbsp;</>
}
