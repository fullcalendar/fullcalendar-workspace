import { ClassNamesGenerator, CustomContentGenerator, DidMountHandler, MountData, WillUnmountHandler } from './common/render-hook.js'

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
  name: string
  borderlessX: boolean
  // TODO: isSticky
}

export interface ToolbarSectionData {
  name: string
}

// Button / Toolbar
// -------------------------------------------------------------------------------------------------

export interface ButtonData {
  name: string
  text: string
  isSelected: boolean
  isDisabled: boolean
  inGroup: boolean
}

export type ButtonMountData = MountData<ButtonData>

export type ButtonDisplay = 'auto' | 'icon' | 'text' | 'icon-text' | 'text-icon'

export interface ButtonIconData {
  direction: 'ltr' | 'rtl' // TODO: DRY
}

export interface ButtonInput {
  didMount?: DidMountHandler<ButtonMountData>
  willUnmount?: DidMountHandler<ButtonMountData>
  click?: (ev: MouseEvent) => void
  hint?: string | ((viewOrCurrentUnitText: string, viewOrCurrentUnit: string) => string)
  classNames?: ClassNamesGenerator<ButtonData>
  display?: ButtonDisplay
  iconClass?: ClassNamesGenerator<ButtonIconData>,
  iconContent?: CustomContentGenerator<ButtonIconData>,
  text?: string
}

// Info for internal rendering
export interface ToolbarWidget {
  name: string
  isView?: boolean
  customElement?: ToolbarElementInput
  buttonText?: string
  buttonHint?: string | ((currentUnit: string) => string)
  buttonDisplay?: ButtonDisplay
  buttonIconClass?: ClassNamesGenerator<ButtonIconData>
  buttonIconContent?: CustomContentGenerator<ButtonIconData>
  buttonClick?: (ev: MouseEvent) => void
  buttonClass?: ClassNamesGenerator<ButtonData>
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
