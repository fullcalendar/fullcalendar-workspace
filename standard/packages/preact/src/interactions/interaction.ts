import { HitTarget } from './hit-target'

export abstract class Interaction {
  target: HitTarget

  constructor(target: HitTarget) {
    this.target = target
  }

  destroy() {
  }
}

export type InteractionClass = { new(target: HitTarget): Interaction }
