# Phase 5: render-hook rollout and leaf conversions

Status: done.

## Goal

- Move every `ContentContainer` user onto the phase-3 primitives (`hook-toolkit-spec.md` §6), then
  delete `ContentContainer` and `ContentInjector`. `<CustomContent>` already has its own copy of
  the result handling.
- Convert the leaf components on the way, including the measure-and-report leaves, which fixes the
  seven mount-time watchers that close over stale props.
- Apply phase 4's shell-plus-variants lesson where a component switches on a mode.

## Scope rule for big classes

Some `ContentContainer` users are big classes with layout logic that phase 7 rewrites (`DayGridRow`,
`DayGridCell`, `ResourcePrintRow`). Converting them now would mean converting twice. Instead, the
render-hook area they own moves into a small function component, and the class renders that.
The spec rules out a polymorphic `tag` component (§6.4), so each area gets its own component.

## Batches

Each batch: targeted specs, `dom-snapshot compare` in both runtimes (DOM plus call counts, which must
never go up), the React suite, then a commit. Sol reviews after 5b, 5c and 5e.

### 5a. Primitives

- `useRenderHookEl({ classGenerator, didMount, willUnmount, renderProps })`, returning
  `{ className, ref }` (§6.4). It's `generateClassName` plus `useMountHooks`.
- `generateClassName` and `renderText` move out of `ContentContainer.ts`.
- `useElementSize` (§4.1) and `useReportedSize` (§4.2), over the existing `watchSize`.
  They include the persistent cache across detach, the hidden-element rule, and publishing through
  `afterSize`.
- No hook gets added before its first user. 5a lands together with 5b's and 5c's first conversions.

### 5b. Pure leaves (no lifecycle, no measurement)

`ButtonIcon`, `ToolbarSection`, `Toolbar`, `ViewContainer`, `NowIndicatorHeaderContainer`,
`NowIndicatorLineContainer`, `TimeGridSlatLane`, `ListDayHeaderInner`, `ListDayHeader`, `ListDay`,
`BgEvent`, `TimelineSlatCell`, `ResourceExpander`, `TimeGridCol`, and `view-config`'s
`createViewHookComponent`.

### 5c. Measure-and-report leaves

- The seven stale watchers: `TimeGridAllDayHeader`, `TimeGridSlatHeader`, `TimeGridWeekNumber`,
  `TimelineHeaderCell`, `Ruler`, `FooterScrollbar`, `MeasuredHeightHarness`.
- The resource spreadsheet cells (`HeaderCell`, `ResourceCell`, `ResourceGroupCell`,
  `ResourceGroupHeaderCell`, `SuperHeaderCell`) and lanes (`GroupLane`, `ResourceLane`). They
  measure and report, and switch between `<td>` and `<div>` on `forPrint`.
  - Check whether one instance actually switches. If it does, use a shell plus variants.
- Each fix of a stale watcher gets a spec that fails on the old code, where one is reachable
  through the public API.

### 5d. Mode switches and areas inside big classes

- `MoreLinkTrigger` (`display` row/column) and `MoreLinkContainer`.
- `DayGridHeaderCell`, shared by DayGrid, TimeGrid and the resource views.
- The areas in `DayGridCell`, `DayGridRow` (inline week number) and `ResourcePrintRow`.
- `MorePopover` and `ListView`, which also switch to `useHitTarget`. (As built, `ListView` stays a
  class; see 5d below.)

### 5e. Delete

- `ContentContainer` and `ContentInjector`, along with their `protected-api` exports, which may
  break.
- Record any leftover `didMountMisfire`-style workaround removals.

## Progress

### 5a–5c (done)

- **Primitives** in `standard/packages/preact/src/hooks/`, all exported from `protected-api`:
  - `useRenderHookEl`: `generateClassName` plus `useMountHooks`, returning `{ className, ref }`. The
    ref is stable and can also forward to an `elRef`.
  - `useReportedSize({ watchWidth, watchHeight, widthRef, heightRef, onSize })`: one watcher per
    element for both dimensions, as `watchSize` requires, so it replaces `useElementSize` too.
    - `onSize` is for components that also keep the size locally (`TimelineHeaderCell`).
    - It reports directly from the watcher callback, as the class code did. State updates go through
      `afterSize`.
  - `useStableCallback`, for handlers passed to memoized children (the resource expanders).
  - `memoWithEquality` (in `vdom-util`), for `ResourceGroupHeaderCell`'s `group` comparator.
  - `generateClassName` and `renderText` moved to `common/render-hook.tsx`.
- **Converted to function components** (with `memo` where they were `BaseComponent`s, which compare
  props shallowly):
  - 5b: `ButtonIcon`, `ToolbarSection` (plus a new `ToolbarButton`), `Toolbar`, `ViewContainer`,
    the two now-indicator containers, `TimeGridSlatLane`, `ListDayHeaderInner`, `ListDayHeader`,
    `ListDay`, `BgEvent`, `TimelineSlatCell`, `ResourceExpander`, and `createViewHookComponent`.
  - 5c: the seven stale watchers (`Ruler`, `MeasuredHeightHarness`, `FooterScrollbar`,
    `TimeGridAllDayHeader`, `TimeGridSlatHeader`, `TimeGridWeekNumber`, `TimelineHeaderCell`), and
    the spreadsheet cells (`HeaderCell`, `SuperHeaderCell`, `ResourceCell`, `ResourceGroupCell`,
    `ResourceGroupHeaderCell`) and `GroupLane`.
- **Areas moved out of big classes:**
  - `TimeGridColLane` (from `TimeGridCol`). It's only for enabled days, as before, so a day turning
    disabled still remounts and its mount hooks still fire.
  - `TimeGridSlatHeaderLabel`, for labeled slats only, for the same reason.
  - `ResourceLaneCell` (from `ResourceLane`). The lane's top and bottom slots render
    `<CustomContent>` directly from the class.
- **The `forPrint` td/div switch** in the spreadsheet cells needed no shell. It only changes the
  tag, and the hooks follow the new element. `useReportedSize` re-registers on it, whereas the class
  code kept watching the detached element.
- **Fixes:**
  - `<CustomContent>` now merges `attrs.className` with `className`, as `ContentInjector` did. It
    used to drop it, which lost the list view's nav-link class.
    - Found by `navLinks in listWeek moves to day view`. The DOM fixtures have no nav links in
      list view.
  - `<CustomContent>`'s `attrs` comparator handles `attrs` being absent on one side.
    - The week number's `attrs` goes from nav-link attributes to `undefined` when day view
      switches to week view (`navLinks in day view moves to week view`). `ContentInjector` used the
      same comparator, so the old code presumably remounted that slot there, but I didn't confirm
      it. If it did, the new code fires the week number's mount hooks less often, which the
      call-count rule allows.
  - `watchWidth` no longer fires on height-only changes (spec §4).
  - `TimeGridLayoutNormal` no longer counts the week number's height toward the axis width (spec
    §9). Spec: `timeGrid axis width is not widened by a tall week-number label`, which fails on the
    old code (304px).
  - Unstable render-prop objects memoized, which can only lower `*Content` call counts:
    - `options` in the custom view `content` hook's render props;
    - `options` in `BgEvent`'s render props.
- **Found by specs:**
  - **A memo comparator that ignores some of a prop's fields gives stale props.** Unlike a class,
    a `memo` that skips a render keeps the old props, and a later context-driven render uses them.
    A class's props update even when `shouldComponentUpdate` returns false.
    - `ResourceGroupHeaderCell` compared `group` by id only, so a changed
      `resourceGroupHeaderContent` (on `group.spec`) never reached it. Found by `render hooks:
      resourceGroupHeader … replacing them when they change`. Its comparator now also checks `spec`
      identity.
    - This can't cause more renders than the class did, because a class re-rendered on every context
      change anyway.
- **No spec for the stale-watcher fixes.** Every caller passes a stable ref (a `RefMap` entry or
  a class-field handler), so the stale capture isn't reachable through the public API.

### 5d–5e (done)

- **Converted to function components:**
  - `MoreLinkTrigger`. Its `display` row/column only changes class names, not structure, so it
    needs no shell.
  - `MoreLinkContainer`, with stable `onClose` and link-element refs for the memoized popover and
    trigger.
  - `MorePopover`, the first built-in user of `useHitTarget`. Its listeners, focus and positioning
    moved from `componentDidMount` to a mount layout effect.
  - `DayGridHeaderCell`. The non-blank branch is a separate `DayGridHeaderCellLabel`, so a cell
    turning blank still remounts. Its `buildDayHeaderText` stays a `memoize` instance, because it's
    called twice per render (spec §3.3).
- **Areas moved out of big classes:**
  - `DayGridCellEl`, from `DayGridCell`. The top content slot renders `<CustomContent>` from the
    class.
  - `InlineWeekNumber`, from `DayGridRow`.
  - `ResourcePrintLaneCell`, from `ResourcePrintRow`. Its top and bottom slots are `<CustomContent>`.
  - `ListNoEvents`, from `ListView`.
- **`ListView` stays a class.** `parseViewConfig` treats a view `component` that isn't a
  `BaseComponent` subclass as a content generator, so a function `ListView` would be misread. It
  converts with the List family in phase 7, and moves to `useHitTarget` then.
- **Deleted** `ContentContainer` and `ContentInjector`, and the `ContentContainer` export from
  `protected-api`.
  - The `El*` prop types moved to `content-inject/el-props.ts`.
  - `hasCustomRenderingHandler` moved into `CustomContent.tsx`.
  - The `didMountMisfire` workaround is gone with `ContentContainer`.
  - `mergeContentInjectors` (an options helper) keeps its name.

### Review of 5a–5c (Sol, round 1)

Two P2 findings, both fixed, both reproduced and pinned by new tests in
`standard/packages/react/tests/hooks.tsx` that fail without the fix:

- **`useReportedSize` kept the dimensions it watched at registration.** It re-registered only on a
  new element. Now a change of `watchWidth`/`watchHeight` re-registers too.
- **A new forwarded `elRef` didn't get the element.** `useRenderHookEl` and `<CustomContent>` (the
  latter from phase 4) left the old ref holding it. Both now use `useForwardedElRef`, which releases
  the old ref and fills the new one.

Sol also explained the eventMaxStack failures:

- **Cause:** the spec teardown (`vanilla-tests/src/lib/global-utils.ts`) removed calendar elements
  without destroying the calendars. Their observers kept running, delivering the 0×0 reports, and
  their popovers stayed in the document, where the specs' global popover lookup could pick a stale
  one.
- **Fix:** teardown now destroys every calendar `initCalendar` made. The hidden-element rule (spec
  §4.1) is restored.

### Review of 5d–5e (Sol, round 1)

No actionable findings. Sol's throwaway check of `MorePopover` under Strict Mode and `<Activity>`
passed, including focus restoration and closing on Escape.

### Results

- Preact:
  - broad filters: standard 1345 + 1132, scheduler 1100 + 1188. All pass.
  - `eventMaxStack`: 3 of 3 runs.
- React suite: 40 of 40.
- DOM snapshots and the 18 call-count scenarios: unchanged against `phase6.preact` and
  `phase4fix.react`.
- Pre-existing failures under the React runtime, failing the same way before phase 5:
  - `destroy … leaves no handlers attached`, 7 specs. Their listener baseline comes from a Preact
    root.
  - `addICalEventSource with day view adds an all day event`, which asserts after a fixed 100ms.
    It failed 4 of 4 on `ebda01409`.

## Watch for

- **Unstable render props.** Phase 4's call-count win came mostly from one unstable object. Check
  each area's render props for one before converting.
- **Ref callbacks:** keep one per instance (phase 4 lesson).
- **Mixed trees in Preact.** A hook parent's layout effect runs before its class children's
  `componentDidMount`. Convert bottom-up (spec §1, consequence 3).
- **Cleanups** read the latest committed values.
