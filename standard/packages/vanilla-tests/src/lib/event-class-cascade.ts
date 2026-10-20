import { CalendarOptions } from 'fullcalendar'
import { waitTimeout } from './misc'

/*
Pins down which event class options reach which part of an event, for each display variant.
StandardEvent decides this today by switching on `display`; phase 4 of the hooks refactor replaces it
with composed components. See planning/phase-2-render-hook-specs.md
*/

export type EventDisplay = 'row' | 'column' | 'listItem'

export interface EventCascadeCase {
  name: string
  display: EventDisplay
  options: CalendarOptions // renders exactly one event, titled EVENT_TITLE
  hasTime: boolean // whether the default content shows a time
}

export const EVENT_TITLE = 'Cascade event'

// option prefix for each layer
const LAYER_PREFIXES = {
  event: 'event',
  block: 'blockEvent',
  row: 'rowEvent',
  column: 'columnEvent',
  listItem: 'listItemEvent',
}

const SLOTS = ['', 'Inner', 'Before', 'After', 'Time', 'Title']

const LAYERS_BY_DISPLAY: { [display in EventDisplay]: string[] } = {
  row: ['event', 'block', 'row'],
  column: ['event', 'block', 'column'],
  listItem: ['event', 'listItem'],
}

const BEFORE_CONTENT = 'cascade-before-content'
const AFTER_CONTENT = 'cascade-after-content'

// e.g. markerClass('block', 'Inner') -> 'cascade-block-inner'
function markerClass(layer: string, slot: string): string {
  return `cascade-${layer}${slot ? '-' + slot.toLowerCase() : ''}`
}

// every event class option, each set to its own marker class
function buildMarkerOptions(): CalendarOptions {
  const options = {}

  for (const layer in LAYER_PREFIXES) {
    for (const slot of SLOTS) {
      options[`${LAYER_PREFIXES[layer]}${slot}Class`] = markerClass(layer, slot)
    }
  }

  return options
}

export function describeEventClassCascade(cases: EventCascadeCase[]): void {
  describe('event class cascade', () => {
    for (const cascadeCase of cases) {
      describe(cascadeCase.name, () => {
        const expectedLayers = LAYERS_BY_DISPLAY[cascadeCase.display]

        async function render(moreOptions: CalendarOptions = {}) {
          initCalendar({ ...cascadeCase.options, ...buildMarkerOptions(), ...moreOptions })
          await waitTimeout()
          return findEventEl()
        }

        it('applies the layers for its display to each part, and no others', async () => {
          const eventEl = await render()
          const parts: [string, HTMLElement | null][] = [
            ['', eventEl],
            ['Inner', findPart(eventEl, 'Inner')],
            ['Before', findPart(eventEl, 'Before')],
            ['After', findPart(eventEl, 'After')],
            ['Title', findPart(eventEl, 'Title')],
          ]

          if (cascadeCase.hasTime) {
            parts.push(['Time', findPart(eventEl, 'Time')])
          }

          for (const [slot, partEl] of parts) {
            expect(partEl).withContext(`part "${slot || 'outer'}" exists`).toBeTruthy()

            for (const layer in LAYER_PREFIXES) {
              expect(partEl.classList.contains(markerClass(layer, slot)))
                .withContext(`part "${slot || 'outer'}" has ${LAYER_PREFIXES[layer]}${slot}Class`)
                .toBe(expectedLayers.includes(layer))
            }
          }
        })

        it('passes timeClass and titleClass with its layers to eventContent', async () => {
          const infos = []
          await render({
            eventContent: (info) => {
              infos.push(info)
              return true
            },
          })

          expect(infos.length).toBeGreaterThan(0)

          for (const [slot, key] of [['Time', 'timeClass'], ['Title', 'titleClass']]) {
            const classes = infos[0][key].split(/\s+/)

            for (const layer in LAYER_PREFIXES) {
              expect(classes.includes(markerClass(layer, slot)))
                .withContext(`${key} has ${LAYER_PREFIXES[layer]}${slot}Class`)
                .toBe(expectedLayers.includes(layer))
            }
          }
        })

        it(`renders rowEventBeforeContent/rowEventAfterContent ${cascadeCase.display === 'row' ? 'for' : 'not for'} ${cascadeCase.display} events`, async () => {
          const eventEl = await render({
            rowEventBeforeContent: BEFORE_CONTENT,
            rowEventAfterContent: AFTER_CONTENT,
          })
          const isRow = cascadeCase.display === 'row'

          expect(eventEl.textContent.includes(BEFORE_CONTENT)).toBe(isRow)
          expect(eventEl.textContent.includes(AFTER_CONTENT)).toBe(isRow)
        })
      })
    }
  })
}

// the outermost element with the eventClass marker that contains the title
function findEventEl(): HTMLElement {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`.${markerClass('event', '')}`))
    .filter((el) => el.textContent.includes(EVENT_TITLE))

  expect(els.length).withContext('one event element').toBe(1)
  return els[0]
}

function findPart(eventEl: HTMLElement, slot: string): HTMLElement | null {
  return eventEl.querySelector(`.${markerClass('event', slot)}`)
}
