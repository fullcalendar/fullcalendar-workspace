# Pass native events to callbacks under React

**Status:** open
**Test:** `standard/.../src/more-link/click.ts` (`it.fails` under `FORCE_REACT=1` only)
**Issues:** none found

Found during the test revamp. Pre-existing.

## The problem

Under the React renderer, `moreLinkClick`'s `jsEvent` is React's SyntheticEvent. The types say `MouseEvent`, and the Preact renderer passes the native event. The same goes for every callback whose handler comes from `createAriaClickAttrs` / `createAriaKeyboardAttrs` (`standard/packages/preact/src/util/dom-event.ts`): `navLinkDayClick` and friends, and `eventClick` from the keyboard. The test runs as a plain `it` under Preact and as `it.fails` under React (`itNotUnderReact`).

The fix itself is small: unwrap `ev.nativeEvent` in those two helpers. None of their handlers read `currentTarget`.

## Why it's an idea, not a quick fix

It changes what React users receive, and some rely on it:

- `jsEvent.nativeEvent`, which React code often reads precisely because it got a SyntheticEvent, would be `undefined`.
- `jsEvent.persist()` and `isPropagationStopped()` would throw.
- `jsEvent.stopPropagation()` would act on the native event rather than React's propagation.

## To decide

- When: v8, or a minor release with a changelog warning.
- Scope: every callback's `jsEvent`, not just `moreLinkClick`. Audit the other callbacks for the same split under React (pointer interactions go through native listeners, so they may already be native).
- Whether to keep a way to reach React's event, or to document that `jsEvent` is always native.
