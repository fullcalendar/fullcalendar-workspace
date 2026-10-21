/*
Side effects a reduction describes instead of performing, like fetching an event source. The reducer
calls `effects.run(effect)` where today's order needs the effect (a fetch runs between allocating its
fetch id and copying the source), and a runner registered for the effect's type performs it, right
then. So nothing observable moves; the store can later decide when to run them.
See planning/phase-9-store.md
*/
export interface Effect {
  type: string
}

export type EffectRunner<E extends Effect = Effect> = (effect: E) => void

export interface EffectRunnerMap {
  [effectType: string]: EffectRunner<any>
}

export interface ReduceEffects {
  run(effect: Effect): void
}

export function createReduceEffects(runners: EffectRunnerMap): ReduceEffects {
  return {
    run(effect: Effect) {
      const runner = runners[effect.type]

      if (!runner) {
        throw new Error(`No effect runner for "${effect.type}"`)
      }

      runner(effect)
    },
  }
}
