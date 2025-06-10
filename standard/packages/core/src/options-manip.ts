import { CustomContentGenerator } from './internal.js'
import { ClassNameInput, joinArrayishClassNames } from './util/html.js'
import { getUnequalProps, mergeMaybePropsShallow, mergeMaybePropsDepth1 } from './util/object.js'

type FuncishClassNameInput = ((data: any) => ClassNameInput) | ClassNameInput

const classNamesRe = /(^c|C)lassNames$/
const contentRe = /Content$/
const lifecycleRe = /(DidMount|WillUnmount)$/
const handlerRe = /^on[A-Z]/

// Somewhat tracks COMPLEX_OPTION_COMPARATORS
// Unfortunately always need 'maybe' to handle undefined inital value, because of CalendarDataManager
const customMergeFuncs = {
  headerToolbar: mergeMaybePropsShallow,
  footerToolbar: mergeMaybePropsShallow,
  buttons: mergeMaybePropsDepth1,
}

/*
Merges an array of objects into a single object.
The second argument allows for an array of property names who's object values will be merged together.
*/
export function mergeRawOptions(optionSets): any {
  let dest = {}

  for (const options of optionSets) {
    for (let name in options) {
      if (name in dest) {
        const mergeFunc = customMergeFuncs[name] || (
          classNamesRe.test(name) ? joinFuncishClassNames :
          contentRe.test(name) ? mergeContentInjectors :
          lifecycleRe.test(name) ? mergeLifecycleCallbacks : undefined
        )
        dest[name] = mergeFunc
          ? mergeFunc(dest[name], options[name])
          : options[name] // last wins
      } else {
        dest[name] = options[name] // last wins
      }
    }
  }

  return dest
}

export function joinFuncishClassNames(
  input0: FuncishClassNameInput, // added to string first
  input1: FuncishClassNameInput
): FuncishClassNameInput {
  const isFunc0 = typeof input0 === 'function'
  const isFunc1 = typeof input1 === 'function'

  if (isFunc0 || isFunc1) {
    return (data: any) => {
      return joinArrayishClassNames(
        isFunc0 ? input0(data) : input0,
        isFunc1 ? input1(data) : input1
      )
    }
  }

  return joinArrayishClassNames(input0 as ClassNameInput, input1 as ClassNameInput)
}

export function mergeContentInjectors(
  contentGenerator0: CustomContentGenerator<any>, // fallback
  contentGenerator1: CustomContentGenerator<any>
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

export function mergeLifecycleCallbacks(
  fn0: (...args: any[]) => any, // called first
  fn1: (...args: any[]) => any
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

export function isNonHandlerPropsEqual(obj0, obj1) {
  const keys = getUnequalProps(obj0, obj1)

  for (let key of keys) {
    if (!handlerRe.test(key)) {
      return false
    }
  }

  return true
}
