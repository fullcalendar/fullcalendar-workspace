import { memo, createElement, type ReactNode, type ReactElement } from 'react'
import { ToolbarWidget, ButtonInfo, ButtonGroupInfo } from './toolbar-types'
import { joinClassNames } from '../util/html'
import { generateClassName } from '../render-hook/render-hook-types'
import { CustomContent } from '../render-hook/CustomContent'
import { useViewOptions } from '../context/useGranularContexts'
import { useRenderHookEl } from '../render-hook/useRenderHookEl'
import { ViewOptionsRefined } from '../options/options'
import { ButtonIcon } from './ButtonIcon'
import classNames from '../styles.module.css'

export interface ToolbarContent {
  title: string
  navUnit: string
  selectedButton: string
  isTodayEnabled: boolean
  isPrevEnabled: boolean
  isNextEnabled: boolean
}

export interface ToolbarSectionProps extends ToolbarContent {
  name: string
  widgetGroups: ToolbarWidget[][]
  titleId?: string
}

const CUSTOM_ELEMENT_STYLE = { display: 'contents' }
const CUSTOM_ELEMENT_RENDER_PROPS = {}

export const ToolbarSection = memo(function ToolbarSection(props: ToolbarSectionProps): any {
  let options = useViewOptions()
  let children = props.widgetGroups.map((widgetGroup) => renderWidgetGroup(widgetGroup, props, options))

  return createElement(
    'div', {
      className: generateClassName(options.toolbarSectionClass, { name: props.name }),
    },
    ...children, // spread, so no React key errors
  )
})

function renderWidgetGroup(widgetGroup: ToolbarWidget[], props: ToolbarSectionProps, options: ViewOptionsRefined): any {
  let children: ReactElement[] = []

  let isOnlyButtons = true
  let isOnlyView = true

  for (const widget of widgetGroup) {
    const { name, isView } = widget

    if (name === 'title') {
      isOnlyButtons = false
    } else if (!isView) {
      isOnlyView = false
    }
  }

  for (let widget of widgetGroup) {
    let { name, customElement, buttonHint } = widget

    if (name === 'title') {
      children.push(
        <div
          role='heading'
          aria-level={options.headingLevel}
          id={props.titleId}
          className={joinClassNames(options.toolbarTitleClass)}
        >{props.title}</div>,
      )
    } else if (customElement) {
      children.push(
        <CustomContent
          tag='span'
          style={CUSTOM_ELEMENT_STYLE}
          renderProps={CUSTOM_ELEMENT_RENDER_PROPS}
          generatorName={undefined}
          generator={customElement}
        />
      )
    } else {
      let isSelected = name === props.selectedButton
      let isDisabled =
        (!props.isTodayEnabled && name === 'today') ||
        (!props.isPrevEnabled && name === 'prev') ||
        (!props.isNextEnabled && name === 'next')

      let buttonDisplay = widget.buttonDisplay ?? options.buttonDisplay
      if (buttonDisplay === 'auto') {
        buttonDisplay = (widget.buttonIconContent || widget.buttonIconClass)
          ? 'icon'
          : 'text'
      }

      let iconNode: ReactNode
      if (buttonDisplay !== 'text') {
        iconNode = (
          <ButtonIcon
            className={widget.buttonIconClass}
            contentGenerator={widget.buttonIconContent}
          />
        )
      }

      let inGroup = widgetGroup.length > 1 && isOnlyButtons
      let buttonGroup: ButtonGroupInfo | null = inGroup ? { hasSelection: isOnlyView } : null
      let renderProps: ButtonInfo = {
        name,
        text: widget.buttonText,
        isPrimary: widget.buttonIsPrimary,
        isSelected,
        isDisabled,
        isIconOnly: buttonDisplay === 'icon',
        buttonGroup,
      }

      let buttonContent = buttonDisplay === 'text'
        ? widget.buttonText
        : buttonDisplay === 'icon'
          ? iconNode
          : buttonDisplay === 'icon-text'
            ? (<>{iconNode}{widget.buttonText}</>)
            : (<>{widget.buttonText}{iconNode}</>) // text-icon

      children.push(
        <ToolbarButton
          widget={widget}
          renderProps={renderProps}
          attrs={{
            type: 'button',
            disabled: isDisabled,
            ...(
              (isOnlyButtons && isOnlyView)
                ? { 'role': 'tab', 'aria-selected': isSelected }
                : { 'aria-pressed': isSelected }
            ),
            'aria-label': typeof buttonHint === 'function'
              ? buttonHint(props.navUnit)
              : buttonHint,
            onClick: widget.buttonClick,
          }}
          className={joinClassNames(
            generateClassName(options.buttonClass, renderProps),
            !isDisabled && classNames.cursorPointer,
            inGroup && joinClassNames(
              isSelected ? classNames.z1 : classNames.z0,
              classNames.focusZ2, // to ensure focus-ring is raised
            ),
          )}
        >{buttonContent}</ToolbarButton>
      )
    }
  }

  if (children.length > 1) {
    return createElement('div', {
      role: (isOnlyButtons && isOnlyView) ? 'tablist' : undefined,
      'aria-label': (isOnlyButtons && isOnlyView) ? options.viewChangeHint : undefined,
      className: joinClassNames(
        generateClassName(options.buttonGroupClass, { hasSelection: isOnlyView }),
        classNames.isolate,
      ),
    }, ...children)
  }

  return children[0]
}

interface ToolbarButtonProps {
  widget: ToolbarWidget
  renderProps: ButtonInfo
  attrs: Record<string, any>
  className: string
  children: ReactNode
}

function ToolbarButton({ widget, renderProps, attrs, className, children }: ToolbarButtonProps) {
  let renderHookEl = useRenderHookEl({
    classGenerator: widget.buttonClass,
    didMount: widget.buttonDidMount,
    willUnmount: widget.buttonWillUnmount,
    renderProps,
  })

  return (
    <button
      {...attrs}
      ref={renderHookEl.ref}
      className={joinClassNames(renderHookEl.className, className) || undefined}
    >{children}</button>
  )
}
