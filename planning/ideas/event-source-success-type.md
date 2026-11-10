# Type an event source function's response by its transform

**Status:** open
**Issues:** [#5182](https://github.com/fullcalendar/fullcalendar/issues/5182) (closed), [#5534](https://github.com/fullcalendar/fullcalendar/issues/5534) (open, related: the same for arrays given to `eventSources`)

## The problem

`EventSourceFunc`, the type of the `events` option (and `eventSources[].events`) as a function, types its success callback and returned promise as `EventInput[]`. But `eventSourceSuccess`, a source's `success` and `eventDataTransform` exist to turn other data into event inputs, and TypeScript rejects the documented pattern when the response is typed:

```ts
interface ApiResponse { data: EventInput[], total: number }

new Calendar(el, {
  events: (info, successCallback) => {
    fetch('/api/events').then((r) => r.json()).then((response: ApiResponse) => {
      successCallback(response)
      // TS error: Argument of type 'ApiResponse' is not assignable to parameter of type 'EventInput[]'
    })
  },
  eventSourceSuccess: (response) => response.data,
})
```

An untyped response (`any`, from `r.json()`) passes, so the error only shows for typed responses or an app's own event model.

## Decided against

Widening the callback to `EventInput[] | unknown` (tried in `345e54ec1`, reverted). TypeScript collapses it to `unknown`, so apps passing standard events lose all checking (`successCallback([{ titel: 'x' }])` compiles). Adam decided the same in 2020 on #5534: keep the strict type for the common case, and cast to `any` when a transform is used.

## The idea

Infer the response type from the transform: when `eventSourceSuccess`, the source's `success` or `eventDataTransform` is given, the callback accepts that transform's input type; otherwise it stays `EventInput[]`. The options system isn't designed for one option's type to depend on another's, so this needs generic calendar options (or a typed source helper, such as `defineEventSource({ events, success })`), which is a large change.
