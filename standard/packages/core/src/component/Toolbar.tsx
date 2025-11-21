import { createElement } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { ToolbarModel, ToolbarWidget } from '../toolbar-struct.js'
import { ToolbarSection, ToolbarContent } from './ToolbarSection.js'
import { joinClassNames } from '../util/html.js'
import { generateClassName } from '../content-inject/ContentContainer.js'

export interface ToolbarProps extends ToolbarContent {
  className?: string
  model: ToolbarModel
  borderlessX: boolean
  titleId?: string
}

export class Toolbar extends BaseComponent<ToolbarProps> {
  render() {
    let { props } = this
    let options = this.context.options
    let { sectionWidgets } = props.model

    return (
      <div
        className={joinClassNames(
          props.className,
          generateClassName(options.toolbarClass, {
            borderlessX: props.borderlessX,
          }),
        )}
      >
        {this.renderSection('start', sectionWidgets.start)}
        {this.renderSection('center', sectionWidgets.center)}
        {this.renderSection('end', sectionWidgets.end)}
      </div>
    )
  }

  renderSection(key: string, widgetGroups: ToolbarWidget[][]) {
    let { props } = this

    return (
      <ToolbarSection
        key={key}
        name={key}
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
}
