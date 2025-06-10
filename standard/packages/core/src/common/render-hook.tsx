/* eslint max-classes-per-file: off */

import { ComponentChildren } from '../preact.js'
import { ClassNamesInput } from '../util/html.js'

export type MountData<DisplayData> = DisplayData & { el: HTMLElement }
export type DidMountHandler<TheMountData extends { el: HTMLElement }> = (mountData: TheMountData) => void
export type WillUnmountHandler<TheMountData extends { el: HTMLElement }> = (mountData: TheMountData) => void

export interface ObjCustomContent {
  html: string
  domNodes: any[]
}

export type CustomContent = ComponentChildren | ObjCustomContent
export type CustomContentGenerator<RenderProps> = CustomContent | ((renderProps: RenderProps, createElement: any) => (CustomContent | true))
export type ClassNamesGenerator<RenderProps> = ClassNamesInput | ((renderProps: RenderProps) => ClassNamesInput)
