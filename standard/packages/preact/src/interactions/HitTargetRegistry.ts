import { EventClicking } from './EventClicking'
import { EventHovering } from './EventHovering'
import { Interaction, InteractionClass } from './interaction'
import { HitTarget, hitTargetStore } from './hit-target'

const DEFAULT_INTERACTIONS: InteractionClass[] = [
  EventClicking,
  EventHovering,
]

/*
A calendar's registered hit targets, each with its interactions: clicking and hovering events, and,
unless the target disables hits, the plugins' (dragging, selecting). The targets also go in the global
hitTargetStore, where the interactions find them
*/
export class HitTargetRegistry {
  private interactionsByUid: { [uid: string]: Interaction[] } = {}

  constructor(
    private getComponentInteractions: () => InteractionClass[], // the plugins', as of the latest render
  ) {
  }

  register = (target: HitTarget) => {
    this.unregister(target.uid) // in case it registers again without unregistering

    let interactionClasses = DEFAULT_INTERACTIONS
    if (!target.disableHits) {
      interactionClasses = interactionClasses.concat(this.getComponentInteractions())
    }

    this.interactionsByUid[target.uid] = interactionClasses.map((TheInteractionClass) => new TheInteractionClass(target))
    hitTargetStore[target.uid] = target
  }

  unregister = (uid: string) => {
    let interactions = this.interactionsByUid[uid]

    if (interactions) {
      for (let interaction of interactions) {
        interaction.destroy()
      }
      delete this.interactionsByUid[uid]
    }

    delete hitTargetStore[uid]
  }
}
