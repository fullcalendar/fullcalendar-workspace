import { createElement, BaseComponent, Fragment, ContentHook } from '@fullcalendar/common'
import { ColSpec } from '@fullcalendar/resource-common'
import { HookProps } from './spreadsheet-cell-util'

export interface SpreadsheetIndividualCellInnerProps {
  hookProps: HookProps
  colSpec: ColSpec
}

export class SpreadsheetIndividualCellInner extends BaseComponent<SpreadsheetIndividualCellInnerProps> { // doesn't need context?
  render() {
    let { props } = this

    return (
      <ContentHook hookProps={props.hookProps} content={props.colSpec.cellContent} defaultContent={renderResourceInner}>
        {(innerElRef, innerContent) => (
          <span className="fc-datagrid-cell-main" ref={innerElRef}>
            {innerContent}
          </span>
        )}
      </ContentHook>
    )
  }
}

function renderResourceInner(hookProps) {
  return hookProps.fieldValue || <Fragment>&nbsp;</Fragment>
}
