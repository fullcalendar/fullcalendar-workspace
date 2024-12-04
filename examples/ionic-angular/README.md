
## Monorepo Quirk

To get this example working within a monorepo, [this hack](https://stackoverflow.com/a/61801741/96342) was added to `tsconfig.app.json`. It can be safely removed if you're not using a monorepo.

```json
"paths": {
  "@angular/*": ["./node_modules/@angular/*"]
},
```

This HACK is still needed because the `dependenciesMeta.*.injected` technique does not work for some reason.
