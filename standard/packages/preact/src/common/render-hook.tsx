/* eslint max-classes-per-file: off */

import type { ReactNode } from 'react'

export type MountData<DisplayData> = DisplayData & { el: HTMLElement }
export type DidMountHandler<DisplayData> = (mountData: MountData<DisplayData>) => void
export type WillUnmountHandler<DisplayData> = (mountData: MountData<DisplayData>) => void

export interface ObjCustomContent {
  html?: string
  domNodes?: any[]
}

export type CustomContent = ReactNode | ObjCustomContent
export type CustomContentGenerator<RenderProps> = CustomContent | ((renderProps: RenderProps) => (CustomContent | true | void | undefined))
export type ClassNameGenerator<RenderProps> = string | undefined | ((renderProps: RenderProps) => string | undefined)
