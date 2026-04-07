import { ClassNameGenerator, CustomContentGenerator, DidMountHandler, WillUnmountHandler } from './common/render-hook'

export interface ToolbarModel {
  sectionWidgets: {
    start: ToolbarWidget[][]
    center: ToolbarWidget[][]
    end: ToolbarWidget[][]
  }
  viewsWithButtons: string[]
  hasTitle: boolean
}

export interface ToolbarData {
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  // TODO: isSticky
}

export interface ToolbarSectionData {
  name: string
}

// Button / Toolbar
// -------------------------------------------------------------------------------------------------

export interface ButtonGroupData {
  isSelectGroup: boolean
}

export interface ButtonData {
  name: string
  text: string
  isPrimary: boolean
  isSelected: boolean
  isDisabled: boolean
  isIconOnly: boolean
  inGroup: boolean
  inSelectGroup: boolean
}

export type ButtonDisplay = 'auto' | 'icon' | 'text' | 'icon-text' | 'text-icon'

export interface ButtonInput {
  didMount?: DidMountHandler<ButtonData>
  willUnmount?: WillUnmountHandler<ButtonData>
  click?: (ev: MouseEvent) => void
  hint?: string | ((viewOrCurrentUnitText: string, viewOrCurrentUnit: string) => string)
  class?: ClassNameGenerator<ButtonData>
  className?: ClassNameGenerator<ButtonData>
  display?: ButtonDisplay
  iconClass?: string | undefined,
  iconContent?: CustomContentGenerator<{}>,
  text?: string
  isPrimary?: boolean
}

// Info for internal rendering
export interface ToolbarWidget {
  name: string
  isView?: boolean
  customElement?: ToolbarElementInput
  buttonText?: string
  buttonHint?: string | ((currentUnit: string) => string)
  buttonDisplay?: ButtonDisplay
  buttonIconClass?: string | undefined
  buttonIconContent?: CustomContentGenerator<{}>,
  buttonClick?: (ev: MouseEvent) => void
  buttonIsPrimary?: boolean
  buttonClass?: ClassNameGenerator<ButtonData>
  buttonDidMount?: DidMountHandler<ButtonData>
  buttonWillUnmount?: WillUnmountHandler<ButtonData>
}

export interface ToolbarInput {
  left?: string
  center?: string
  right?: string
  start?: string
  end?: string
}

// Custom Elements
// -------------------------------------------------------------------------------------------------

export type ToolbarElementInput = CustomContentGenerator<{}>
