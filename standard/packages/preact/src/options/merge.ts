import { ClassNameInput, ContentGenerator, refineClassName } from '../render-hook/render-hook-types'
import { joinClassNames } from '../util/html'
import { getUnequalProps, isPropsEqualWithFunc, mergeMaybePropsDepth1, mergePropsWithFunc } from '../util/object'
import { CalendarOptions, ViewOptions } from './options'

type FuncishClassNameInput = ((info: any) => ClassNameInput) | ClassNameInput

const classNamesRe = /(^c|C)lass(Name)?$/
const contentRe = /Content$/
const lifecycleRe = /(DidMount|WillUnmount)$/
const handlerRe = /^on[A-Z]/

// Somewhat tracks COMPLEX_OPTION_COMPARATORS (refiner.ts)
// Unfortunately always need 'maybe' to handle undefined inital value, because of the options refiner (OptionsRefinerCache)
const customMergeFuncs = {
  buttons: mergeMaybeButtonInputs,
}

/*
Between the user's own layers (the initial options, a view type's and its super type's, setOption), a
button's options are replaced as a whole, as before: each layer is the user's later say
*/
const userLayerMergeFuncs = {
  buttons: mergeMaybePropsDepth1,
}

/*
A button's options combine like the calendar's top-level ones: classes join, content falls back (`true`),
lifecycle callbacks both run. The rest (text, hint, click, iconClass...) are last-wins
*/
const BUTTON_MERGE_FUNCS = {
  class: joinFuncishClassNames,
  className: joinFuncishClassNames,
  iconContent: mergeContentInjectors,
  didMount: mergeLifecycleCallbacks,
  willUnmount: mergeLifecycleCallbacks,
}

// the `buttons` option: per button, per option
export function mergeMaybeButtonInputs(buttons0: any, buttons1: any): any {
  if (!buttons0) {
    return buttons1
  }

  return mergePropsWithFunc(buttons0, buttons1, mergeButtonInput)
}

function mergeButtonInput(button0: any, button1: any): any {
  if (!button0 || !button1) {
    return button1 || button0
  }

  const dest = { ...button0 }

  for (const key in button1) {
    const mergeFunc = BUTTON_MERGE_FUNCS[key]

    dest[key] = (mergeFunc && key in button0)
      ? mergeFunc(button0[key], button1[key], key)
      : button1[key]
  }

  return dest
}

/*
The `buttons` option's comparator: per button, per option, a combined function equals one combined from
the same parts (merging makes a new one each time)
*/
export function isMaybeButtonInputsEqual(buttons0: any, buttons1: any): boolean {
  if (isNonNullObject(buttons0) && isNonNullObject(buttons1)) {
    return isPropsEqualWithFunc(buttons0, buttons1, isButtonInputEqual)
  }

  return buttons0 === buttons1
}

function isButtonInputEqual(button0: any, button1: any): boolean {
  if (isNonNullObject(button0) && isNonNullObject(button1)) {
    return isPropsEqualWithFunc(button0, button1, (val0, val1) => val0 === val1 || isMergedPropsEqual(val0, val1))
  }

  return button0 === button1
}

function isNonNullObject(val: any): boolean {
  return typeof val === 'object' && val !== null
}

export function mergeViewOptionsMap(
  ...hashes: { [view: string]: ViewOptions }[]
): { [view: string]: ViewOptions } {
  const merged: { [view: string]: ViewOptions } = {}

  for (const hash of hashes) {
    for (const viewName in hash) {
      const viewOptions = hash[viewName]

      if (!merged[viewName]) {
        merged[viewName] = viewOptions
      } else {
        merged[viewName] = mergeCalendarOptions(merged[viewName], viewOptions)
      }
    }
  }

  return merged
}

/*
Merges an array of RAW options objects into a single object.
The second argument allows for an array of property names who's object values will be merged together.
*/
export function mergeCalendarOptions(...optionSets: CalendarOptions[]): any {
  return mergeOptionSets(optionSets, customMergeFuncs)
}

// the user's own option layers (see userLayerMergeFuncs)
export function mergeUserOptions(...optionSets: CalendarOptions[]): any {
  return mergeOptionSets(optionSets, userLayerMergeFuncs)
}

function mergeOptionSets(optionSets: CalendarOptions[], customFuncs: { [name: string]: Function }): any {
  let dest = {}

  for (const options of optionSets) {
    for (let name in options) {
      if (name in dest) {
        const mergeFunc = customFuncs[name] || (
          classNamesRe.test(name) ? joinFuncishClassNames :
          contentRe.test(name) ? mergeContentInjectors :
          lifecycleRe.test(name) ? mergeLifecycleCallbacks : undefined
        )
        dest[name] = mergeFunc
          ? (mergeFunc as any)(dest[name], options[name], name)
          : options[name] // last wins
      } else {
        dest[name] = options[name] // last wins
      }
    }
  }

  return dest
}

/*
Called while merging raw option objects, before the normal option refinement pass.
ClassName values are validated here because merging may join raw strings, or build a
combined function that joins raw generator outputs later. Without checking each part
before joinClassNames, invalid values like objects/arrays could be stringified into
valid-looking class strings before refineClassName/refineClassNameGenerator see them.

Ideally this would be a single-pass responsibility: either merge after refinement, or
store unjoined class parts during raw merging and have one later refiner validate and
join all parts. For now, this merge helper validates just enough to avoid corrupting
invalid values before the formal refinement pass.
*/
export function joinFuncishClassNames(
  input0: FuncishClassNameInput, // added to string first
  input1: FuncishClassNameInput,
  optionName: string,
): FuncishClassNameInput {
  const isFunc0 = typeof input0 === 'function'
  const isFunc1 = typeof input1 === 'function'

  if (isFunc0 || isFunc1) {
    const combinedFunc = (info: any) => {
      return joinClassNames(
        refineClassName(isFunc0 ? input0(info) : input0, optionName),
        refineClassName(isFunc1 ? input1(info) : input1, optionName),
      )
    }
    (combinedFunc as any).parts = [input0, input1] // see OptionsRefinerCache::processRawCalendarOptions
    return combinedFunc
  }

  return joinClassNames(
    refineClassName(input0 as ClassNameInput, optionName),
    refineClassName(input1 as ClassNameInput, optionName),
  )
}

export function mergeContentInjectors(
  contentGenerator0: ContentGenerator<any>, // fallback
  contentGenerator1: ContentGenerator<any>
): ContentGenerator<any> {
  if (typeof contentGenerator1 === 'function') {
    // fabricate new function
    const combinedFunc = (renderProps: any) => {
      const res = contentGenerator1(renderProps)
      if (res === true) { // `true` indicates use-fallback
        if (typeof contentGenerator0 === 'function') {
          return contentGenerator0(renderProps)
        }
        return contentGenerator0
      }
      return res
    }
    (combinedFunc as any).parts = [contentGenerator0, contentGenerator1] // see OptionsRefinerCache::processRawCalendarOptions
    return combinedFunc
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
    const combinedFunc = (...args: any[]) => {
      fn0(...args)
      fn1(...args)
    }
    (combinedFunc as any).parts = [fn0, fn1] // see OptionsRefinerCache::processRawCalendarOptions
    return combinedFunc
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

export function isMergedPropsEqual(val0: any, val1: any): boolean {
  const parts0 = val0 && val0.parts
  const parts1 = val1 && val1.parts

  if (parts0 && parts1) {
    const count0 = parts0.length
    const count1 = parts1.length

    if (count0 !== count1) {
      return false
    }

    for (let i = 0; i < count0; i++) {
      if (!(parts0[i] === parts1[i] || isMergedPropsEqual(parts0[i], parts1[i]))) {
        return false
      }
    }

    return true
  }

  return false
}
