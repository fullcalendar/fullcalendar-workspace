import { preventDefault } from './dom-event.js'

export type Falsy = false | null | undefined // TODO: 0 ?

export type GenericHash = { [key: string]: any } // already did this somewhere

let guidNumber = 0

export function guid() {
  guidNumber += 1
  return String(guidNumber)
}

/* FullCalendar-specific DOM Utilities
----------------------------------------------------------------------------------------------------------------------*/

// Make the mouse cursor express that an event is not allowed in the current area
export function disableCursor() {
  document.body.classList.add('fcu-not-allowed')
}

// Returns the mouse cursor to its original look
export function enableCursor() {
  document.body.classList.remove('fcu-not-allowed')
}

/* Selection
----------------------------------------------------------------------------------------------------------------------*/

export function preventSelection(el: HTMLElement) {
  el.style.userSelect = 'none'
  el.style.webkitUserSelect = 'none'
  el.addEventListener('selectstart', preventDefault)
}

export function allowSelection(el: HTMLElement) {
  el.style.userSelect = ''
  el.style.webkitUserSelect = ''
  el.removeEventListener('selectstart', preventDefault)
}

/* Context Menu
----------------------------------------------------------------------------------------------------------------------*/

export function preventContextMenu(el: HTMLElement) {
  el.addEventListener('contextmenu', preventDefault)
}

export function allowContextMenu(el: HTMLElement) {
  el.removeEventListener('contextmenu', preventDefault)
}

/* Object Ordering by Field
----------------------------------------------------------------------------------------------------------------------*/

export interface OrderSpec<Subject> {
  field?: string
  order?: number
  func?: FieldSpecInputFunc<Subject>
}

export type FieldSpecInput<Subject> = string | string[] | FieldSpecInputFunc<Subject> | FieldSpecInputFunc<Subject>[]
export type FieldSpecInputFunc<Subject> = (a: Subject, b: Subject) => number

export function parseFieldSpecs<Subject>(input: FieldSpecInput<Subject>): OrderSpec<Subject>[] {
  let specs: OrderSpec<Subject>[] = []
  let tokens = []
  let i
  let token

  if (typeof input === 'string') {
    tokens = input.split(/\s*,\s*/)
  } else if (typeof input === 'function') {
    tokens = [input]
  } else if (Array.isArray(input)) {
    tokens = input
  }

  for (i = 0; i < tokens.length; i += 1) {
    token = tokens[i]

    if (typeof token === 'string') {
      specs.push(
        token.charAt(0) === '-' ?
          { field: token.substring(1), order: -1 } :
          { field: token, order: 1 },
      )
    } else if (typeof token === 'function') {
      specs.push({ func: token })
    }
  }

  return specs
}

export function compareByFieldSpecs<Subject>(obj0: Subject, obj1: Subject, fieldSpecs: OrderSpec<Subject>[]): number {
  let i
  let cmp

  for (i = 0; i < fieldSpecs.length; i += 1) {
    cmp = compareByFieldSpec(obj0, obj1, fieldSpecs[i])
    if (cmp) {
      return cmp
    }
  }

  return 0
}

export function compareByFieldSpec<Subject>(obj0: Subject, obj1: Subject, fieldSpec: OrderSpec<Subject>): number {
  if (fieldSpec.func) {
    return fieldSpec.func(obj0, obj1)
  }

  return flexibleCompare(obj0[fieldSpec.field], obj1[fieldSpec.field])
    * (fieldSpec.order || 1)
}

export function flexibleCompare(a, b) {
  if (!a && !b) {
    return 0
  }
  if (b == null) {
    return -1
  }
  if (a == null) {
    return 1
  }
  if (typeof a === 'string' || typeof b === 'string') {
    return String(a).localeCompare(String(b))
  }
  return a - b
}

/* String Utilities
----------------------------------------------------------------------------------------------------------------------*/

export function padStart(val, len) { // doesn't work with total length more than 3
  let s = String(val)
  return '000'.substr(0, len - s.length) + s
}

export function formatWithOrdinals<Args extends any[]>(
  formatter: string | ((...formatterArgs: Args) => string),
  args: Args,
  fallbackText: string,
) {
  if (typeof formatter === 'function') {
    return formatter(...args)
  }
  if (typeof formatter === 'string') { // non-blank string
    return args.reduce((str, arg, index) => (
      str.replace('$' + index, arg || '')
    ), formatter)
  }
  return fallbackText
}

/* Number Utilities
----------------------------------------------------------------------------------------------------------------------*/

export function compareNumbers(a, b) { // for .sort()
  return a - b
}

export function isInt(n) {
  return n % 1 === 0
}

/* Weird Utilities
----------------------------------------------------------------------------------------------------------------------*/

export function firstDefined(...args) {
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== undefined) {
      return args[i]
    }
  }
  return undefined
}

export function valuesIdentical<T>(a: T, b: T): boolean {
  return a === b
}
