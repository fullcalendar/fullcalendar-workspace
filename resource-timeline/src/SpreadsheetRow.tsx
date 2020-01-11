import {
  h, Fragment,
  BaseComponent, ComponentContext, findElements, isArraysEqual
} from '@fullcalendar/core'
import { Resource, buildResourceFields, buildResourceTextFunc, ResourceApi } from '@fullcalendar/resource-common'
import ExpanderIcon from './ExpanderIcon'

export interface SpreadsheetRowProps {
  colSpecs: any
  rowSpans: number[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  resource: Resource
}

export default class SpreadsheetRow extends BaseComponent<SpreadsheetRowProps, ComponentContext> {


  render(props: SpreadsheetRowProps, state: {}, context: ComponentContext) {
    let { calendar } = context
    let { resource, rowSpans, depth } = props
    let resourceFields = buildResourceFields(resource) // slightly inefficient. already done up the call stack

    return (
      <tr data-resource-id={resource.id} ref={this.handleTrEl}>
        {props.colSpecs.map((colSpec, i) => {
          let rowSpan = rowSpans[i]

          if (rowSpan === 0) { // not responsible for group-based rows. VRowGroup is
            return
          } else if (rowSpan == null) {
            rowSpan = 1
          }

          let innerText
          if (colSpec.field) {
            innerText = resourceFields[colSpec.field]
          } else {
            innerText = buildResourceTextFunc(colSpec.text, calendar)(resource)
          }
          let innerContent = innerText || <Fragment>&nbsp;</Fragment>

          if (rowSpan > 1) {
            return (
              <td rowSpan={rowSpan}>
                <div class='fc-cell-content vgrow'>
                  <span class='fc-sticky'>
                    {innerContent}
                  </span>
                </div>
              </td>
            )
          } else {
            return (
              <td rowSpan={rowSpan}>
                <div class='cell-content-wrap'>
                  <div class='fc-cell-content cell-content'>
                    { colSpec.isMain &&
                      <ExpanderIcon
                        depth={depth}
                        hasChildren={props.hasChildren}
                        isExpanded={props.isExpanded}
                        onExpanderClick={this.onExpanderClick}
                      />
                    }
                    <span class='fc-cell-text'>
                      {innerContent}
                    </span>
                  </div>
                </div>
              </td>
            )
          }
        })}
      </tr>
    )
  }


  handleTrEl = (trEl: HTMLElement | null) => {
    let { calendar, view } = this.context
    let { colSpecs, resource } = this.props

    if (trEl) {
      let tdEls = findElements(trEl, 'td')

      for (let i = 0; i < colSpecs.length; i++) {
        let colSpec = colSpecs[i]
        let tdEl = tdEls[i]

        if (typeof colSpec.render === 'function') {
          colSpec.render(
            new ResourceApi(calendar, resource),
            tdEl.querySelector('.fc-cell-content')
          )
        }

        if (colSpec.isMain) {
          calendar.publiclyTrigger('resourceRender', [
            {
              resource: new ResourceApi(calendar, resource),
              el: tdEl,
              view
            }
          ])
        }
      }
    }
  }


  onExpanderClick = (ev: UIEvent) => {
    let { props } = this

    if (props.hasChildren) {
      this.context.calendar.dispatch({
        type: 'SET_RESOURCE_ENTITY_EXPANDED',
        id: props.resource.id,
        isExpanded: !props.isExpanded
      })
    }
  }

}

SpreadsheetRow.addPropsEquality({
  rowSpans: isArraysEqual
})
