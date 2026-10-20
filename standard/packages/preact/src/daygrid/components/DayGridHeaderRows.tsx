import { memo } from 'react'
import { RowConfig } from '../header-tier'
import { DayGridHeaderRow } from './DayGridHeaderRow'

export interface DayGridHeaderRowsProps {
  headerTiers: RowConfig<any, { text: string, isDisabled: boolean }>[]
  cellIsNarrow: boolean
  cellIsMicro: boolean
  tableMode?: boolean
  colWidth?: number
  viewportWidth?: number
}

export const DayGridHeaderRows = memo(function DayGridHeaderRows(props: DayGridHeaderRowsProps) {
  const { headerTiers, tableMode } = props

  return (
    <>
      {headerTiers.map((rowConfig, i) => (
        <DayGridHeaderRow
          {...rowConfig}
          key={i}
          role='row'
          borderBottom={i < headerTiers.length - 1}
          colWidth={props.colWidth}
          viewportWidth={props.viewportWidth}
          cellIsNarrow={props.cellIsNarrow}
          cellIsMicro={props.cellIsMicro}
          rowLevel={headerTiers.length - i - 1}
          tableMode={tableMode}
        />
      ))}
    </>
  )
})
