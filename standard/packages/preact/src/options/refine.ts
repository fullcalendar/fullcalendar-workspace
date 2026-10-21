import { DateFormatter } from '@full-ui/headless-calendar'
import type { RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/protected-api'
import { CalendarApi } from '../api/CalendarApi'
import { createFormatter, FormatterInput } from '../datelib/formatting'
import { Dictionary } from '../util/object'

/*
Refining raw option values: the refiner functions' types, and running a set of them over an input
*/

export function refineProps<Refiners extends GenericRefiners, Raw extends RawOptionsFromRefiners<Refiners>>(
  input: Raw,
  refiners: Refiners,
): {
  refined: RefinedOptionsFromRefiners<Refiners>,
  extra: Dictionary,
} {
  let refined = {} as any
  let extra = {} as any

  for (let propName in refiners) {
    if (propName in input) {
      refined[propName] = refiners[propName](input[propName], propName)
    }
  }

  for (let propName in input) {
    if (!(propName in refiners)) {
      extra[propName] = input[propName]
    }
  }

  return { refined, extra }
}

export type GenericRefiners = {
  [propName: string]: (input: any, propName: string) => any
}

export type GenericListenerRefiners = {
  [listenerName: string]: Identity<(this: CalendarApi, ...args: any[]) => void>
}

export type DefaultedRefinedOptions<RefinedOptions extends Dictionary, DefaultKey extends keyof RefinedOptions> =
  Required<Pick<RefinedOptions, DefaultKey>> &
  Partial<Omit<RefinedOptions, DefaultKey>>

export type Identity<T = any> = (raw: T) => T

export function identity<T>(raw: T): T {
  return raw
}

// a date format option that may be false (no text)
export function createFalsableFormatter(input: FormatterInput | false): DateFormatter {
  return input === false ? null : createFormatter(input)
}
