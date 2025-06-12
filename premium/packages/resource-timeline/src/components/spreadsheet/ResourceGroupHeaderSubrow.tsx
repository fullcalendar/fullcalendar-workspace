import { BaseComponent, ViewContext, ContentContainer, watchHeight, setRef, joinClassNames, generateClassName, joinArrayishClassNames } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement, Fragment, ComponentChild, Ref, createRef } from '@fullcalendar/core/preact'
import { Group, createGroupId, isGroupsEqual } from '@fullcalendar/resource/internal'
import { ResourceIndent } from './ResourceIndent.js'
import { ResourceExpander } from './ResourceExpander.js'
import { ResourceGroupHeaderData, GroupSpec } from '../../structs.js'

export interface ResourceGroupHeaderSubrowProps {
  group: Group
  isExpanded: boolean // for aria
  colSpan: number // for aria
  borderBottom: boolean
  className?: string
  indentWidth: number | undefined

  // aria
  role?: string
  rowIndex?: number
  level?: number

  // refs
  innerHeightRef?: Ref<number>

  // position
  top?: number
  height?: number
}

export class ResourceGroupHeaderSubrow extends BaseComponent<ResourceGroupHeaderSubrowProps, ViewContext> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps: ResourceGroupHeaderData = {
      fieldValue: props.group.value,
      view: context.viewApi,
    }
    let spec = props.group.spec as GroupSpec // type HACK

    return (
      <div
        role={props.role as any} // !!!
        aria-rowindex={props.rowIndex}
        aria-level={props.level}
        aria-expanded={props.isExpanded}
        className={joinArrayishClassNames(
          options.resourceAreaRowClass,
          props.className,
          props.borderBottom ? classNames.borderOnlyB : classNames.borderNone,
          classNames.flexRow,
          classNames.contentBox,
        )}
        style={{
          top: props.top,
          height: props.height
        }}
      >
        <ContentContainer
          tag="div"
          attrs={{
            role: 'rowheader',
            'aria-colspan': props.colSpan,
            'aria-expanded': props.isExpanded,
          }}
          className={joinClassNames(
            classNames.tight,
            classNames.liquid,
          )}
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
                generateClassName(spec.labelInnerClass, renderProps),
                classNames.rigid,
                classNames.flexRow,
              )}
            >
              <ResourceIndent level={1} indentWidth={props.indentWidth}>
                <ResourceExpander
                  isExpanded={props.isExpanded}
                  onExpanderClick={this.onExpanderClick}
                />
              </ResourceIndent>
              <InnerContent tag="div" />
            </div>
          )}
        </ContentContainer>
      </div>
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

ResourceGroupHeaderSubrow.addPropsEquality({
  group: isGroupsEqual,
})

function renderCellInner(renderProps: ResourceGroupHeaderData): ComponentChild {
  return renderProps.fieldValue || <Fragment>&nbsp;</Fragment>
}
