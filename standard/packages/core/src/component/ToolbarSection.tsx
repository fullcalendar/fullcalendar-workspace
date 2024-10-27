import { createElement, VNode } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { ToolbarWidget } from '../toolbar-struct.js'
import { joinClassNames } from '../util/html.js'

export interface ToolbarContent {
  title: string
  navUnit: string
  activeButton: string
  isTodayEnabled: boolean
  isPrevEnabled: boolean
  isNextEnabled: boolean
}

export interface ToolbarSectionProps extends ToolbarContent {
  name: string
  widgetGroups: ToolbarWidget[][]
}

export class ToolbarSection extends BaseComponent<ToolbarSectionProps> {
  render(): any {
    let children = this.props.widgetGroups.map((widgetGroup) => this.renderWidgetGroup(widgetGroup))

    return createElement(
      'div', {
        className: 'fc-toolbar-chunk fc-toolbar-' + this.props.name
      },
      ...children,
    )
  }

  renderWidgetGroup(widgetGroup: ToolbarWidget[]): any {
    let { props } = this
    let { theme } = this.context
    let children: VNode[] = []
    let isOnlyButtons = true

    for (let widget of widgetGroup) {
      let { buttonName, buttonClick, buttonText, buttonIcon, buttonHint } = widget

      if (buttonName === 'title') {
        isOnlyButtons = false
        children.push(
          <h2 className="fc-toolbar-title">{props.title}</h2>,
        )
      } else {
        let isPressed = buttonName === props.activeButton
        let isDisabled =
          (!props.isTodayEnabled && buttonName === 'today') ||
          (!props.isPrevEnabled && buttonName === 'prev') ||
          (!props.isNextEnabled && buttonName === 'next')

        children.push(
          <button
            type="button"
            title={typeof buttonHint === 'function' ? buttonHint(props.navUnit) : buttonHint}
            disabled={isDisabled}
            aria-pressed={isPressed}
            className={joinClassNames(
              `fc-${buttonName}-button`,
              theme.getClass('button'),
              isPressed && theme.getClass('buttonActive'),
            )}
            onClick={buttonClick}
          >
            {buttonText || (buttonIcon ? <span className={buttonIcon} role="img" /> : '')}
          </button>,
        )
      }
    }

    if (children.length > 1) {
      let groupClassName = (isOnlyButtons && theme.getClass('buttonGroup')) || ''

      return createElement('div', { className: groupClassName }, ...children)
    }
    return children[0]
  }
}
