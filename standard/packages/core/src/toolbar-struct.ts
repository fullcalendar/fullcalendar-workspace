import { ClassNameGenerator, CustomContentGenerator, DidMountHandler, MountData, WillUnmountHandler } from './common/render-hook.js'
import { ClassNameInput } from './util/html.js'

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

export type ButtonMountData = MountData<ButtonData>

export type ButtonDisplay = 'auto' | 'icon' | 'text' | 'icon-text' | 'text-icon'

export interface ButtonInput {
  didMount?: DidMountHandler<ButtonMountData>
  willUnmount?: DidMountHandler<ButtonMountData>
  click?: (ev: MouseEvent) => void
  hint?: string | ((viewOrCurrentUnitText: string, viewOrCurrentUnit: string) => string)
  class?: ClassNameGenerator<ButtonData>
  className?: ClassNameGenerator<ButtonData>
  display?: ButtonDisplay
  iconClass?: ClassNameInput,
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
  buttonIconClass?: ClassNameInput
  buttonIconContent?: CustomContentGenerator<{}>,
  buttonClick?: (ev: MouseEvent) => void
  buttonIsPrimary?: boolean
  buttonClass?: ClassNameGenerator<ButtonData>
  buttonDidMount?: DidMountHandler<ButtonMountData>
  buttonWillUnmount?: WillUnmountHandler<ButtonMountData>
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
