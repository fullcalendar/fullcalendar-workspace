import { h, SubRenderer, subrenderer } from '@fullcalendar/core'
import SpreadsheetHeader from './SpreadsheetHeader'
import SpreadsheetBody from './SpreadsheetBody'

export interface SpreadsheetColWidthsProps {
  header: SpreadsheetHeader
  body: SpreadsheetBody
  colSpecs: any
}

export default class SpreadsheetColWidths extends SubRenderer<SpreadsheetColWidthsProps> {

  private initColWidthSyncing = subrenderer(this._initColWidthSyncing)


  render(props: SpreadsheetColWidthsProps) {
    let { colSpecs } = props

    this.initColWidthSyncing({ header: props.header })

    this.applyColWidths(
      colSpecs.map((colSpec) => colSpec.width)
    )
  }


  _initColWidthSyncing({ header }: { header: SpreadsheetHeader }) {
    header.emitter.on('colwidthchange', (colWidths: number[]) => {
      this.applyColWidths(colWidths)
    })
  }


  applyColWidths(colWidths: (number | string)[]) {
    let { header, body } = this.props

    colWidths.forEach((colWidth, colIndex) => {
      let headEl = header.colEls[colIndex]
      let bodyEl = body.colEls[colIndex]
      let styleVal: string

      if (typeof colWidth === 'number') {
        styleVal = colWidth + 'px'
      } else if (typeof colWidth == null) {
        styleVal = ''
      }

      headEl.style.width = bodyEl.style.width = styleVal
    })
  }

}


export function renderColGroupNodes(colSpecs) {
  return colSpecs.map((colSpec) =>
    <col class={colSpec.isMain ? 'fc-main-col' : ''} />)
}
