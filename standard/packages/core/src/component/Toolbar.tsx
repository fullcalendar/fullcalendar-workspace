import { BaseComponent } from '../vdom-util'
import { ToolbarModel, ToolbarWidget } from '../toolbar-struct'
import { ToolbarSection, ToolbarContent } from './ToolbarSection'
import { joinClassNames } from '../util/html'
import { generateClassName } from '../content-inject/ContentContainer'

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

  renderSection(name: string, widgetGroups: ToolbarWidget[][]) {
    let { props } = this

    return (
      <ToolbarSection
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
}
