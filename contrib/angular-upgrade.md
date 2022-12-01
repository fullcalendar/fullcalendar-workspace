
Before upgrading: higher version of Angular CLI sometimes do not output libs that support older
versions. For example. Angular 15 outputs for >=14. More info:

- Incompatibilities in `dist/lib/fesm2015/fullcalendar-angular.mjs`:
  - `i0.ɵɵngDeclareComponent({ minVersion: "14.0.0"`
- Search args for "ɵɵComponentDeclaration" in:
  - https://cdn.jsdelivr.net/npm/@angular/core@15.0.1/index.d.ts
  - https://cdn.jsdelivr.net/npm/@angular/core@14.0.1/index.d.ts
  - https://cdn.jsdelivr.net/npm/@angular/core@13.3.12/core.d.ts
  - https://cdn.jsdelivr.net/npm/@angular/core@12.2.17/core.d.ts


Create new lib with certain version of angular cli:

```
npx -p "@angular/cli@13" ng new "@fullcalendar/angular-new" \
  --directory "angular-new" \
  --new-project-root . \
  --create-application=false \
  --skip-install

# then, pnpm-install in root

cd angular-new
pnpm ng generate library lib --skip-install
pnpm ng generate application app --skip-install

# then, install in root again
```

Port over fullcalendar-related dependencies to `package.json`
Port over `package.json::(scripts|publishConfig|dependenciesNote|versionNote)`

In `.gitignore` add "outer monorepo" line at end

Rename the `lib` package to `@fullcalendar/angular-new`:

1. `tsconfig.json::compilerOptions.paths`
2. `lib/package.json::name`

Remove unnecessary `app` assets:

1. In `angular.json` remove `"assets": [` arrays
2. `rm -rf app/src/assets app/src/favicon.ico`
3. Temporarily change all references of `@fullcalendar/angular` to `@fullcalendar/angular-new`

Restore `lib` files:

1. Take note if meta files or dir structure changed
2. `rm -rf lib/src`
3. `git checkout -- lib/src`

Restore `app` files:

1. Take note if meta files or dir structure changed
2. `rm -rf app/src`
3. `git checkout -- app/src`

Port over README/LICENSE/CONTRIBUTORS/CHANGELOG

Review

AFTER:

Rename all `@fullcalendar/angular-new` to `@fullcalendar/angular`

Automatically update `.editorconfig` and such via `meta:update` scripts. Squash into previous commit
