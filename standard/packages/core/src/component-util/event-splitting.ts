import { EventStore, createEmptyEventStore } from '../structs/event-store.js'
import { EventDef } from '../structs/event-def.js'
import { EventInteractionState } from '../interactions/event-interaction-state.js'
import { mapHash } from '../util/object.js'
import { memoize } from '../util/memoize.js'
import { EventUiHash, EventUi, combineEventUis } from './event-ui.js'
import { DateSpan } from '../structs/date-span.js'

export interface SplittableProps {
  businessHours: EventStore | null // is this really allowed to be null?
  dateSelection: DateSpan | null
  eventStore: EventStore
  eventUiBases: EventUiHash
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  eventSelection: string
}

const EMPTY_EVENT_STORE = createEmptyEventStore() // for purecomponents. TODO: keep elsewhere

export abstract class Splitter<PropsType extends SplittableProps = SplittableProps> {
  private getKeysForEventDefs = memoize(this._getKeysForEventDefs)
  private splitDateSelection = memoize(this._splitDateSpan)
  private splitEventStore = memoize(this._splitEventStore)
  private splitIndividualUi = memoize(this._splitIndividualUi)
  private splitEventDrag = memoize(this._splitInteraction)
  private splitEventResize = memoize(this._splitInteraction)
  private eventUiBuilders = {} // TODO: typescript protection

  abstract getKeyInfo(props: PropsType): { [key: string]: { ui?: EventUi, businessHours?: EventStore } }
  abstract getKeysForDateSpan(dateSpan: DateSpan): string[]
  abstract getKeysForEventDef(eventDef: EventDef): string[]

  splitProps(props: PropsType): { [key: string]: SplittableProps } {
    let keyInfos = this.getKeyInfo(props)
    let defKeys = this.getKeysForEventDefs(props.eventStore)
    let dateSelections = this.splitDateSelection(props.dateSelection)
    let individualUi = this.splitIndividualUi(props.eventUiBases, defKeys) // the individual *bases*
    let eventStores = this.splitEventStore(props.eventStore, defKeys)
    let eventDrags = this.splitEventDrag(props.eventDrag)
    let eventResizes = this.splitEventResize(props.eventResize)
    let splitProps: { [key: string]: SplittableProps } = {}

    this.eventUiBuilders = mapHash(keyInfos, (info, key) => this.eventUiBuilders[key] || memoize(buildEventUiForKey))

    for (let key in keyInfos) {
      let keyInfo = keyInfos[key]
      let eventStore = eventStores[key] || EMPTY_EVENT_STORE
      let buildEventUi = this.eventUiBuilders[key]

      splitProps[key] = {
        businessHours: keyInfo.businessHours || props.businessHours,
        dateSelection: dateSelections[key] || null,
        eventStore,
        eventUiBases: buildEventUi(props.eventUiBases[''], keyInfo.ui, individualUi[key]),
        eventDrag: eventDrags[key] || null,
        eventResize: eventResizes[key] || null,
        eventSelection: eventStore.instances[props.eventSelection] ? props.eventSelection : '',
      }
    }

    return splitProps
  }

  private _splitDateSpan(dateSpan: DateSpan | null) {
    let dateSpans = {}

    if (dateSpan) {
      let keys = this.getKeysForDateSpan(dateSpan)

      for (let key of keys) {
        dateSpans[key] = dateSpan
      }
    }

    return dateSpans
  }

  private _getKeysForEventDefs(eventStore: EventStore) {
    return mapHash(eventStore.defs, (eventDef: EventDef) => this.getKeysForEventDef(eventDef))
  }

  private _splitEventStore(eventStore: EventStore, defKeys): { [key: string]: EventStore } {
    let { defs, instances } = eventStore
    let splitStores = {}

    for (let defId in defs) {
      for (let key of defKeys[defId]) {
        if (!splitStores[key]) {
          splitStores[key] = createEmptyEventStore()
        }

        splitStores[key].defs[defId] = defs[defId]
      }
    }

    for (let instanceId in instances) {
      let instance = instances[instanceId]

      for (let key of defKeys[instance.defId]) {
        if (splitStores[key]) { // must have already been created
          splitStores[key].instances[instanceId] = instance
        }
      }
    }

    return splitStores
  }

  private _splitIndividualUi(eventUiBases: EventUiHash, defKeys): { [key: string]: EventUiHash } {
    let splitHashes: { [key: string]: EventUiHash } = {}

    for (let defId in eventUiBases) {
      if (defId) { // not the '' key
        for (let key of defKeys[defId]) {
          if (!splitHashes[key]) {
            splitHashes[key] = {}
          }

          splitHashes[key][defId] = eventUiBases[defId]
        }
      }
    }

    return splitHashes
  }

  private _splitInteraction(interaction: EventInteractionState | null): { [key: string]: EventInteractionState } {
    let splitStates: { [key: string]: EventInteractionState } = {}

    if (interaction) {
      let affectedStores = this._splitEventStore(
        interaction.affectedEvents,
        this._getKeysForEventDefs(interaction.affectedEvents), // can't use cached. might be events from other calendar
      )

      // can't rely on defKeys because event data is mutated
      let mutatedKeysByDefId = this._getKeysForEventDefs(interaction.mutatedEvents)
      let mutatedStores = this._splitEventStore(interaction.mutatedEvents, mutatedKeysByDefId)

      let populate = (key) => {
        if (!splitStates[key]) {
          splitStates[key] = {
            affectedEvents: affectedStores[key] || EMPTY_EVENT_STORE,
            mutatedEvents: mutatedStores[key] || EMPTY_EVENT_STORE,
            isEvent: interaction.isEvent,
          }
        }
      }

      for (let key in affectedStores) {
        populate(key)
      }

      for (let key in mutatedStores) {
        populate(key)
      }
    }

    return splitStates
  }
}

function buildEventUiForKey(allUi: EventUi | null, eventUiForKey: EventUi | null, individualUi: EventUiHash | null) {
  let baseParts = []

  if (allUi) {
    baseParts.push(allUi)
  }

  if (eventUiForKey) {
    baseParts.push(eventUiForKey)
  }

  let stuff = {
    '': combineEventUis(baseParts),
  }

  if (individualUi) {
    Object.assign(stuff, individualUi)
  }

  return stuff
}
