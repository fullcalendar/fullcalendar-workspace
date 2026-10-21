import { Hit } from './hit'
import { ViewContext } from '../context/ViewContext'
import classNames from '../styles.module.css'

/*
What interactions know about a registered component: where it is, how to query a date at a point,
and the bits of its state that decide whether a pointerdown starts an interaction.
Fields other than uid, el, useEventCenter and disableHits are read live, through getters or a ref,
so they never go stale between re-renders. See planning/hook-toolkit-spec.md §5.4
*/
export interface HitTarget {
  readonly uid: string
  readonly el: HTMLElement
  readonly useEventCenter: boolean // a dragged event's center decides its hit. false for popovers
  readonly disableHits: boolean // no date clicking, selecting, dragging or resizing
  readonly context: ViewContext
  readonly eventSelection: string | undefined
  readonly isEventInteracting: boolean // an event drag or resize is being rendered
  readonly isHitComboAllowed: ((hit0: Hit, hit1: Hit) => boolean) | null
  prepareHits(): void
  queryHit(isRtl: boolean, positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit | null
}

export interface HitTargetSettings {
  el: HTMLElement
  useEventCenter?: boolean
  disableHits?: boolean
}

export type HitTargetStore = { [uid: string]: HitTarget }

// global state, the droppable areas of every calendar. read when dragging between calendars
export const hitTargetStore: HitTargetStore = {}

export function hitTargetToStore(target: HitTarget): HitTargetStore {
  return { [target.uid]: target }
}

export function isValidSegDownEl(target: HitTarget, el: HTMLElement): boolean {
  return !target.isEventInteracting &&
    !el.closest(`.${classNames.internalEventMirror}`)
}

export function isValidDateDownEl(el: HTMLElement): boolean {
  return !el.closest(
    `.${classNames.internalEvent}:not(.${classNames.internalBgEvent})`,
  ) &&
    !el.closest(`.${classNames.internalMoreLink}`) &&
    !el.closest(`.${classNames.internalNavLink}`) &&
    !el.closest(`.${classNames.internalPopover}`) // hack
}
