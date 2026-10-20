import { Calendar, CalendarOptions } from 'fullcalendar'
import { waitTimeout } from './misc'

/*
Table-driven specs for the user-visible contract of render-hook options (*Class, *Content, *DidMount,
*WillUnmount). They pin down what the hooks refactor must preserve. Deliberately not pinned: call
counts, the order of mount calls across areas, timing relative to other callbacks.
See planning/phase-2-render-hook-specs.md
*/

export interface RenderHookArea {
  name: string
  options: CalendarOptions // renders the area
  classOption?: string
  isClassStringOnly?: boolean
  contentOption?: string // can be a sub-slot's option, if it renders inside the area's element
  hasDefaultContent?: boolean
  didMountOption?: string
  willUnmountOption?: string
  infoKeys?: string[] // spot-checked in the info object the hooks receive
  contentSlotsPerEl?: number // default 1
  isContentInSomeEls?: boolean // some of the area's elements have no content slot
  // checks that fail because of a known bug, keyed by check name. they become pending specs
  knownBugs?: Partial<Record<CheckName, string>>
  // for hooks that aren't top-level options, like per-button ones
  buildOption?: (optionName: string, value: any) => CalendarOptions
  setup?: (calendar: Calendar) => Promise<void> | void // after the first render, e.g. open a popover
}

type CheckName = 'classString' | 'classFunc' | 'contentString' | 'contentHtml' | 'contentDomNodes' |
  'contentTrue' | 'didMount' | 'willUnmount'

const PROBE_CLASS = 'render-hook-probe'
const PROBE_FUNC_CLASS = 'render-hook-probe-func'
const PROBE_TEXT = 'render-hook-probe-text'
const PROBE_HTML_CLASS = 'render-hook-probe-html'
const PROBE_DOM_CLASS = 'render-hook-probe-dom'

export function describeRenderHookContract(area: RenderHookArea): void {
  const buildOption = area.buildOption || ((name: string, value: any) => ({ [name]: value }))

  // the probe class identifies the area's elements in every spec
  function buildProbeOptions(): CalendarOptions {
    return area.classOption ? buildOption(area.classOption, PROBE_CLASS) : {}
  }

  const slotsPerEl = area.contentSlotsPerEl ?? 1

  // a known bug turns the spec into a pending one
  function check(checkName: CheckName, title: string, func: () => Promise<void>) {
    const knownBug = area.knownBugs?.[checkName]

    if (knownBug) {
      xit(`${title} (KNOWN BUG: ${knownBug})`, func)
    } else {
      it(title, func)
    }
  }

  // asserts that the area's elements have the content, `countContent(el)` times per slot
  function expectContent(els: HTMLElement[], countContent: (el: HTMLElement) => number) {
    expect(els.length).toBeGreaterThan(0)

    const counts = els.map(countContent)

    if (area.isContentInSomeEls) {
      expect(counts.some((count) => count === slotsPerEl)).toBe(true)
      expect(counts.every((count) => count === 0 || count === slotsPerEl)).toBe(true)
    } else {
      expect(counts).toEqual(counts.map(() => slotsPerEl))
    }
  }

  describe(`render hooks: ${area.name}`, () => {
    if (area.classOption) {
      check('classString', `applies a ${area.classOption} string`, async () => {
        const { els } = await renderArea(area, buildProbeOptions())
        expect(els.length).toBeGreaterThan(0)
      })

      if (!area.isClassStringOnly) {
        check('classFunc', `calls a ${area.classOption} function with info and applies its result`, async () => {
          const infos = []
          await renderArea(area, buildOption(area.classOption, (info) => {
            infos.push(info)
            return PROBE_FUNC_CLASS
          }))

          expect(infos.length).toBeGreaterThan(0)
          expectInfoKeys(infos[0], area.infoKeys)
          expect(document.querySelectorAll(`.${PROBE_FUNC_CLASS}`).length).toBeGreaterThan(0)
        })
      }
    }

    if (area.contentOption) {
      check('contentString', `renders a ${area.contentOption} string`, async () => {
        const { els } = await renderArea(area, combineOptions(
          buildProbeOptions(),
          buildOption(area.contentOption, () => PROBE_TEXT),
        ))

        expectContent(els, (el) => el.textContent.split(PROBE_TEXT).length - 1)
      })

      check('contentHtml', `renders ${area.contentOption} { html }`, async () => {
        const { els } = await renderArea(area, combineOptions(
          buildProbeOptions(),
          buildOption(area.contentOption, () => ({ html: `<b class="${PROBE_HTML_CLASS}">html</b>` })),
        ))

        expectContent(els, (el) => el.querySelectorAll(`.${PROBE_HTML_CLASS}`).length)
      })

      check('contentDomNodes', `renders ${area.contentOption} { domNodes }, replacing them when they change`, async () => {
        let callCnt = 0
        const { calendar, els } = await renderArea(area, combineOptions(
          buildProbeOptions(),
          buildOption(area.contentOption, () => {
            callCnt += 1
            const node = document.createElement('span')
            node.className = PROBE_DOM_CLASS
            return { domNodes: [node] }
          }),
        ))

        expectContent(els, (el) => el.querySelectorAll(`.${PROBE_DOM_CLASS}`).length)

        // a re-render that calls the content function again returns new nodes, replacing the old
        const callCntBefore = callCnt
        calendar.setOption('dragScroll', false)
        await waitTimeout()

        if (callCnt > callCntBefore) {
          expectContent(findAreaEls(area), (el) => el.querySelectorAll(`.${PROBE_DOM_CLASS}`).length)
        }
      })

      if (area.hasDefaultContent) {
        check('contentTrue', `renders the default content when ${area.contentOption} returns true`, async () => {
          const { calendar: calendar0, els: els0 } = await renderArea(area, buildProbeOptions())
          const defaultHtmls = els0.map(normalizeInnerHtml)
          calendar0.destroy()

          const { els: els1 } = await renderArea(area, combineOptions(
            buildProbeOptions(),
            buildOption(area.contentOption, () => true),
          ))

          expect(defaultHtmls.length).toBeGreaterThan(0)
          expect(defaultHtmls.join('')).not.toBe('')
          expect(els1.map(normalizeInnerHtml)).toEqual(defaultHtmls)
        })
      }
    }

    if (area.didMountOption) {
      check('didMount', `calls ${area.didMountOption} with el, in the document, with custom content inside`, async () => {
        const mounts = []
        await renderArea(area, combineOptions(
          buildProbeOptions(),
          area.contentOption ? buildOption(area.contentOption, () => PROBE_TEXT) : {},
          buildOption(area.didMountOption, (info) => {
            mounts.push({
              info,
              isConnected: info.el.isConnected,
              hasProbeClass: info.el.classList.contains(PROBE_CLASS),
              text: info.el.textContent,
            })
          }),
        ))

        expect(mounts.length).toBeGreaterThan(0)
        expectInfoKeys(mounts[0].info, area.infoKeys)

        for (const mount of mounts) {
          expect(mount.isConnected).toBe(true)

          if (area.classOption) {
            expect(mount.hasProbeClass).toBe(true)
          }
          if (area.contentOption && !area.isContentInSomeEls) {
            expect(mount.text).toContain(PROBE_TEXT)
          }
        }
      })
    }

    if (area.willUnmountOption) {
      check('willUnmount', `calls ${area.willUnmountOption} with el for every mounted el`, async () => {
        const mountedEls = []
        const unmountedEls = []
        const { calendar } = await renderArea(area, combineOptions(
          buildProbeOptions(),
          area.didMountOption ? buildOption(area.didMountOption, (info) => mountedEls.push(info.el)) : {},
          buildOption(area.willUnmountOption, (info) => {
            expectInfoKeys(info, area.infoKeys)
            unmountedEls.push(info.el)
          }),
        ))

        calendar.destroy()

        expect(unmountedEls.length).toBeGreaterThan(0)
        for (const el of unmountedEls) {
          expect(el instanceof HTMLElement).toBe(true)

          if (area.classOption) {
            expect(el.classList.contains(PROBE_CLASS)).toBe(true)
          }
        }

        if (area.didMountOption) {
          expect(unmountedEls.length).toBe(mountedEls.length)
        }
      })
    }
  })
}

async function renderArea(area: RenderHookArea, hookOptions: CalendarOptions) {
  const calendar = initCalendar(combineOptions(area.options, hookOptions))
  await waitTimeout()

  if (area.setup) {
    await area.setup(calendar)
    await waitTimeout()
  }

  return { calendar, els: findAreaEls(area) }
}

// elements anywhere in the document, so ones in portals (popovers) are found too
function findAreaEls(area: RenderHookArea): HTMLElement[] {
  if (!area.classOption) {
    return []
  }
  return Array.from(document.querySelectorAll<HTMLElement>(`.${PROBE_CLASS}`))
}

// merges plain objects deeply, so that per-button options combine
function combineOptions(...optionSets: CalendarOptions[]): CalendarOptions {
  const merged = {}

  for (const options of optionSets) {
    for (const key in options) {
      const val0 = merged[key]
      const val1 = options[key]

      merged[key] = isPlainObject(val0) && isPlainObject(val1)
        ? combineOptions(val0, val1)
        : val1
    }
  }

  return merged
}

// generated ids differ between renders
function normalizeInnerHtml(el: HTMLElement): string {
  return el.innerHTML.replace(/\s(id|for|aria-[a-z]+)="[^"]*"/g, '')
}

function isPlainObject(val: any): boolean {
  return Boolean(val) && Object.getPrototypeOf(val) === Object.prototype
}

function expectInfoKeys(info: any, keys: string[] = []) {
  for (const key of keys) {
    expect(key in info).withContext(`info has "${key}"`).toBe(true)
  }
}
