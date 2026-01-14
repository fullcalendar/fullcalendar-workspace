/* eslint max-classes-per-file: off */

import type { ReactNode } from 'react'

export type MountData<DisplayData> = DisplayData & { el: HTMLElement }
export type DidMountHandler<TheMountData extends { el: HTMLElement }> = (mountData: TheMountData) => void
export type WillUnmountHandler<TheMountData extends { el: HTMLElement }> = (mountData: TheMountData) => void

export interface ObjCustomContent {
  html?: string
  domNodes?: any[]
}

export type CustomContent = ReactNode | ObjCustomContent
export type CustomContentGenerator<RenderProps> = CustomContent | ((renderProps: RenderProps, createElement: any) => (CustomContent | true | void | undefined))
export type ClassNameGenerator<RenderProps> = string | undefined | ((renderProps: RenderProps) => string | undefined)
