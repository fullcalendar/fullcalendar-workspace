/*
Ordering by field specs: the eventOrder/resourceOrder-style inputs (field names, '-field' for
descending, or comparator functions), parsed and compared
*/

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

export function compareNumbers(a, b) { // for .sort()
  return a - b
}

/* Weird Utilities
----------------------------------------------------------------------------------------------------------------------*/
