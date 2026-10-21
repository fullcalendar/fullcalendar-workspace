import { memo } from 'react'
import { ToolbarModel, ToolbarWidget } from '../toolbar-struct'
import { ToolbarSection, ToolbarContent } from './ToolbarSection'
import { joinClassNames } from '../util/html'
import { generateClassName } from '../common/render-hook'
import { computeViewBorderless } from '../util/misc'
import { useViewOptions } from '../hooks/useGranularContexts'

export interface ToolbarProps extends ToolbarContent {
  model: ToolbarModel
  isHeader: boolean
  titleId?: string
}

export const Toolbar = memo(function Toolbar(props: ToolbarProps) {
  let options = useViewOptions()
  let { sectionWidgets } = props.model

  const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)
  const toolbarClassOption = props.isHeader ? options.headerToolbarClass : options.footerToolbarClass

  return (
    <div
      className={joinClassNames(
        generateClassName(toolbarClassOption, { borderlessX, borderlessTop, borderlessBottom }),
        generateClassName(options.toolbarClass, { borderlessX, borderlessTop, borderlessBottom }),
      )}
    >
      {renderSection('start', sectionWidgets.start, props)}
      {renderSection('center', sectionWidgets.center, props)}
      {renderSection('end', sectionWidgets.end, props)}
    </div>
  )
})

function renderSection(name: string, widgetGroups: ToolbarWidget[][], props: ToolbarProps) {
  return (
    <ToolbarSection
      key={name}
      name={name}
      widgetGroups={widgetGroups}
      title={props.title}
      titleId={props.titleId}
      navUnit={props.navUnit}
      selectedButton={props.selectedButton}
      isTodayEnabled={props.isTodayEnabled}
      isPrevEnabled={props.isPrevEnabled}
      isNextEnabled={props.isNextEnabled}
    />
  )
}
