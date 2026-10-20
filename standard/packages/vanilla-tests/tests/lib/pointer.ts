import { commands } from 'vitest/browser'

declare module 'vitest/browser' {
  interface BrowserCommands {
    mouseMove: (x: number, y: number, steps?: number) => Promise<void>
    mouseDown: () => Promise<void>
    mouseUp: () => Promise<void>
  }
}

export interface Point {
  x: number
  y: number
}

let isPressed = false

/*
Real mouse input through Playwright. Points are client coordinates, as from getBoundingClientRect.
`move` sends intermediate mousemoves, because FullCalendar only starts a drag after the pointer
travels a few pixels and only updates the hit on a move.
*/
export const pointer = {
  async move(point: Point, steps = 5): Promise<void> {
    await commands.mouseMove(point.x, point.y, steps)
  },

  async down(point: Point): Promise<void> {
    await commands.mouseMove(point.x, point.y)
    await commands.mouseDown()
    isPressed = true
  },

  async up(): Promise<void> {
    isPressed = false
    await commands.mouseUp()
  },

  async click(point: Point): Promise<void> {
    await this.down(point)
    await this.up()
  },

  /*
  Presses at `from`, runs `whilePressed`, and always releases, so a failure mid-gesture doesn't
  leave the button held for the next test.
  */
  async press(from: Point, whilePressed: () => Promise<void>): Promise<void> {
    await this.down(from)
    try {
      await whilePressed()
    } finally {
      if (isPressed) {
        await this.up()
      }
    }
  },
}

/*
For teardown: releases a button left pressed by a test that failed or timed out mid-gesture.
*/
export async function releasePointer(): Promise<void> {
  if (isPressed) {
    await pointer.up()
  }
}

export function getRectCenter(rect: DOMRect): Point {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}
