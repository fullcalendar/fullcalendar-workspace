import { isMaybeObjectsEqual } from '../options.js'
import { joinArrayishClassNames } from './html.js'
import { CustomContentGenerator } from '../common/render-hook.js'

const { hasOwnProperty } = Object.prototype

// special-cases
const classNamesRe = /(^c|C)lassNames$/
const contentRe = /Content$/
const lifecycleRe = /(DidMount|WillUnmount)$/

// Merges an array of objects into a single object.
// The second argument allows for an array of property names who's object values will be merged together.
export function mergeProps(propObjs, complexPropsMap?): any {
  let dest = {}

  if (complexPropsMap) {
    for (let name in complexPropsMap) {
      if (complexPropsMap[name] === isMaybeObjectsEqual) { // implies that it's object-mergeable
        let complexObjs = []

        // collect the trailing object values, stopping when a non-object is discovered
        for (let i = propObjs.length - 1; i >= 0; i -= 1) {
          let val = propObjs[i][name]

          if (typeof val === 'object' && val) { // non-null object
            complexObjs.unshift(val)
          } else if (val !== undefined) {
            dest[name] = val // if there were no objects, this value will be used
            break
          }
        }

        // if the trailing values were objects, use the merged value
        if (complexObjs.length) {
          dest[name] = mergeProps(complexObjs)
        }
      }
    }
  }

  // copy values into the destination, going from last to first
  for (let i = propObjs.length - 1; i >= 0; i -= 1) {
    let props = propObjs[i]

    for (let name in props) {
      if (name in dest) {
        // special-case merging
        if (classNamesRe.test(name)) {
          dest[name] = joinFuncishClassNames(props[name], dest[name])
        } else if (contentRe.test(name)) {
          dest[name] = mergeContentInjectors(props[name], dest[name])
        } else if (lifecycleRe.test(name)) {
          dest[name] = mergeLifecycleCallbacks(props[name], dest[name])
        }
        // otherwise, don't use
      } else {
        dest[name] = props[name]
      }
    }
  }

  return dest
}

export function filterHash(hash, func) {
  let filtered = {}

  for (let key in hash) {
    if (func(hash[key], key)) {
      filtered[key] = hash[key]
    }
  }

  return filtered
}

export function mapHash<InputItem, OutputItem>(
  hash: { [key: string]: InputItem },
  func: (input: InputItem, key: string) => OutputItem,
): { [key: string]: OutputItem } {
  let newHash = {}

  for (let key in hash) {
    newHash[key] = func(hash[key], key)
  }

  return newHash
}

export function arrayToHash(a): { [key: string]: true } { // TODO: rename to strinArrayToHash or something
  let hash = {}

  for (let item of a) {
    hash[item] = true
  }

  return hash
}

export function buildHashFromArray<Item, ItemRes>(a: Item[], func: (item: Item, index: number) => [ string, ItemRes ]) {
  let hash: { [key: string]: ItemRes } = {}

  for (let i = 0; i < a.length; i += 1) {
    let tuple = func(a[i], i)

    hash[tuple[0]] = tuple[1]
  }

  return hash
}

// TODO: reassess browser support
// https://caniuse.com/?search=object.values
export function hashValuesToArray(obj) { // can't use Object.values yet because no es2015 support
  let a = []

  for (let key in obj) {
    a.push(obj[key])
  }

  return a
}

export function isPropsEqual(obj0, obj1) { // TODO: merge with compareObjs
  if (obj0 === obj1) {
    return true
  }

  for (let key in obj0) {
    if (hasOwnProperty.call(obj0, key)) {
      if (!(key in obj1)) {
        return false
      }
    }
  }

  for (let key in obj1) {
    if (hasOwnProperty.call(obj1, key)) {
      if (obj0[key] !== obj1[key]) {
        return false
      }
    }
  }

  return true
}

const HANDLER_RE = /^on[A-Z]/

export function isNonHandlerPropsEqual(obj0, obj1) {
  const keys = getUnequalProps(obj0, obj1)

  for (let key of keys) {
    if (!HANDLER_RE.test(key)) {
      return false
    }
  }

  return true
}

export function getUnequalProps(obj0, obj1) {
  let keys: string[] = []

  for (let key in obj0) {
    if (hasOwnProperty.call(obj0, key)) {
      if (!(key in obj1)) {
        keys.push(key)
      }
    }
  }

  for (let key in obj1) {
    if (hasOwnProperty.call(obj1, key)) {
      if (obj0[key] !== obj1[key]) {
        keys.push(key)
      }
    }
  }

  return keys
}

export type EqualityFunc<T> = (a: T, b: T) => boolean
export type EqualityThing<T> = EqualityFunc<T> | true

export type EqualityFuncs<ObjType> = { // not really just a "func" anymore
  [K in keyof ObjType]?: EqualityThing<ObjType[K]>
}

export function compareObjs(oldProps, newProps, equalityFuncs: EqualityFuncs<any> = {}) {
  if (oldProps === newProps) {
    return true
  }

  for (let key in newProps) {
    if (key in oldProps && isObjValsEqual(oldProps[key], newProps[key], equalityFuncs[key])) {
      // equal
    } else {
      return false
    }
  }

  // check for props that were omitted in the new
  for (let key in oldProps) {
    if (!(key in newProps)) {
      return false
    }
  }

  return true
}

/*
assumed "true" equality for handler names like "onReceiveSomething"
*/
function isObjValsEqual<T>(val0: T, val1: T, comparator: EqualityThing<T>) {
  if (val0 === val1 || comparator === true) {
    return true
  }
  if (comparator) {
    return comparator(val0, val1)
  }
  return false
}

export function collectFromHash<Item>(
  hash: { [key: string]: Item },
  startIndex = 0,
  endIndex?: number,
  step = 1,
) {
  let res: Item[] = []

  if (endIndex == null) {
    endIndex = Object.keys(hash).length
  }

  for (let i = startIndex; i < endIndex; i += step) {
    let val = hash[i]

    if (val !== undefined) { // will disregard undefined for sparse arrays
      res.push(val)
    }
  }

  return res
}

// Special-case handling
// -------------------------------------------------------------------------------------------------

type Falsy = false | null | undefined
type ClassNameInput = string | number | Falsy
type ClassNamesInput = ClassNameInput[] | ClassNameInput
type FuncishClassNames = ((arg: any) => ClassNamesInput) | ClassNamesInput

function joinFuncishClassNames(
  input0: FuncishClassNames, // added first
  input1: FuncishClassNames, // added second
): FuncishClassNames {
  const isFunc0 = typeof input0 === 'function'
  const isFunc1 = typeof input1 === 'function'

  if (isFunc0 || isFunc1) {
    return (arg: any) => {
      return joinArrayishClassNames(
        isFunc0 ? input0(arg) : input0,
        isFunc1 ? input1(arg) : input1,
      )
    }
  }

  return joinArrayishClassNames(input0 as ClassNamesInput, input1 as ClassNamesInput)
}

function mergeContentInjectors(
  contentGenerator0: CustomContentGenerator<any>, // fallback
  contentGenerator1: CustomContentGenerator<any>, // override
): CustomContentGenerator<any> {
  if (typeof contentGenerator1 === 'function') {
    // fabricate new function
    return (renderProps: any, createElement: any) => {
      const res = contentGenerator1(renderProps, createElement)
      if (res === true) { // `true` indicates use-fallback
        if (typeof contentGenerator0 === 'function') {
          return contentGenerator0(renderProps, createElement)
        }
        return contentGenerator0
      }
      return res
    }
  }

  if (contentGenerator1 != null) {
    return contentGenerator1
  }

  return contentGenerator0
}

function mergeLifecycleCallbacks(
  fn0: (...args: any[]) => any, // called first
  fn1: (...args: any[]) => any, // called second
): (...args: any[]) => any {
  if (fn0 && fn1) {
    // fabricate new function
    return (...args: any[]) => {
      fn0(...args)
      fn1(...args)
    }
  }
  return fn0 || fn1
}
