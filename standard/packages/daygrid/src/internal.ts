import './index.css'

export { DayTableSlicer } from './DayTableSlicer.js'
export { TableDateProfileGenerator, buildDayTableRenderRange } from './TableDateProfileGenerator.js'

export { DayGridView } from './components/DayGridView.js'

// TODO: rename to just 'header/' ?
export { DayGridHeaderRow, DayGridHeaderRowProps } from './components/DayGridHeaderRow.js'

export {
  CellRenderConfig,
  CellDataConfig,
  RowConfig,
  buildDateRowConfigs,
  buildDateRowConfig,
  buildDateRenderConfig,
  buildDateDataConfigs,
} from './header-tier.js'

export { createDayHeaderFormatter } from './components/util.js'

export { DayGridLayout, DayGridLayoutProps } from './components/DayGridLayout.js'
export { DayGridRow, DayGridRowProps, COMPACT_CELL_WIDTH } from './components/DayGridRow.js'
export { DayGridRows } from './components/DayGridRows.js'
export {
  buildDayTableModel,
  computeColWidth,
  computeColFromPosition,
  getRowEl,
  getCellEl,
} from './components/util.js'
