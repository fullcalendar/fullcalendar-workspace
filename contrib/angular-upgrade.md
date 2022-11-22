
Rename `contrib/angular` to `contrib/angular-old`

Run `./contrib/angular-init.sh`

Improve scripts in root `package.json`:

```diff
   "scripts": {
     "ng": "ng",
     "start": "ng serve",
-    "build": "ng build",
+    "build": "ng build lib && pnpm run meta",
-    "watch": "ng build --watch --configuration development",
+    "watch": "ng build lib --watch --configuration development",
-    "test": "ng test lib"
+    "test": "ng test lib --watch=false --browsers ChromeHeadless",
+    "test:dev": "ng test lib",
+    "clean": "rm -rf dist .angular/cache",
+    "meta": "mkdir -p dist/lib && cp README.md LICENSE.txt dist/lib",
+    "ci": "pnpm run clean && pnpm run build && pnpm run test"
   },
```

Reintroduce `package.json::(publishConfig|dependenciesNote|versionNote)`

Reintroduce `lib/ng-package.json::allowedNonPeerDependencies`

Port over fullcalendar-related dependencies to `package.json`

Automatically update `.editorconfig` and such via `meta:update` scripts

Rename the `lib` package to `@fullcalendar/angular`:

1. `tsconfig.json::compilerOptions.paths`
2. `lib/package.json::name`

Remove unnecessary `app` assets:

1. In `angular.json` remove `"assets": [` arrays
2. `rm -rf app/src/assets app/src/favicon.ico`

Restore `lib` files:

1. Take note if meta files or dir structure changed
2. `rm -rf lib/src`
3. `git checkout -- lib/src`

Restore `app` files:

1. Take note if meta files or dir structure changed
2. `rm -rf app/src`
3. `git checkout -- app/src`

Add `allowSyntheticDefaultImports` to root `tsconfig.json`

In `.gitignore` add "outer monorepo" line at end

Review and commit changes

`rm -rf contrib/angular-old`
