
To initialize a new project:

```
ng_version="21"
pnpm --package "@angular/cli@${ng_version}" dlx ng new "@fullcalendar-examples/angular${ng_version}" --directory "angular${ng_version}" --skip-install
```

Answer NO to routing. Answer CSS.

Update src/index.html `<title>` to match project name

Npm-script:
- "test"
- "test:dev"
- "clean"

Problems with tsconfig.json and .gitignore
