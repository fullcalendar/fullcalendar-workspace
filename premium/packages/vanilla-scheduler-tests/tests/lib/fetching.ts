import { vi } from 'vitest'
import { Calendar } from 'fullcalendar'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'

/*
A `resources` or `events` function that answers asynchronously, when the test says so.
Each call is held until `release` (or `releaseAll`). `produce` builds the response from the call's
1-based number, so tests can tell responses apart (ex: titles 'a-1', 'a-2').
*/
export function createHeldFetch<Item>(produce: (callNum: number) => Item[]) {
  const held: { callNum: number, respond: () => void }[] = []
  const fetch = vi.fn((_info: unknown, successCallback: (items: Item[]) => void) => {
    const callNum = fetch.mock.calls.length
    held.push({ callNum, respond: () => successCallback(produce(callNum)) })
  })

  return {
    fetch,

    get heldCallNums(): number[] {
      return held.map((call) => call.callNum)
    },

    /*
    Answers one held call (by its 1-based call number), then waits for the render to settle.
    */
    async release(callNum: number): Promise<void> {
      const i = held.findIndex((call) => call.callNum === callNum)

      if (i === -1) {
        throw new Error(`Call ${callNum} isn't held (held: ${held.map((call) => call.callNum).join(', ')})`)
      }

      held.splice(i, 1)[0].respond()
      await waitForSettle()
    },

    /*
    Answers every held call, oldest first, then waits for the render to settle.
    */
    async releaseAll(): Promise<void> {
      for (const call of held.splice(0)) {
        call.respond()
      }
      await waitForSettle()
    },
  }
}

/*
Resolves when the calendar next finishes loading (its `loading` callback is called with false), then
waits for the resulting render to settle. Call it before the fetch can finish.
*/
export async function whenLoaded(calendar: Calendar): Promise<void> {
  await new Promise<void>((resolve) => {
    const handler = (isLoading: boolean) => {
      if (!isLoading) {
        calendar.off('loading', handler)
        resolve()
      }
    }
    calendar.on('loading', handler)
  })
  await waitForSettle()
}
