import { createElement } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { ToolbarModel, ToolbarWidget } from '../toolbar-struct.js'
import { ToolbarSection, ToolbarContent } from './ToolbarSection.js'
import { joinArrayishClassNames } from '../util/html.js'

export interface ToolbarProps extends ToolbarContent {
  className: string // wish this could be array, but easier for pureness
  model: ToolbarModel
  titleId?: string
}

export class Toolbar extends BaseComponent<ToolbarProps> {
  render() {
    let options = this.context.options
    let { model, className } = this.props
    let { sectionWidgets } = model

    return (
      <div
        className={joinArrayishClassNames(
          className,
          'fc-toolbar',
          options.toolbarClassNames,
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
