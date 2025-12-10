# Color Palette Split

This document describes the process of splitting color palettes from a single `palettes.css` file into individual palette files, one per color. This allows themes to export individual color palettes that can be imported separately.

## Prerequisites

The theme should have a `palettes.css` file with:
1. A color-independent section at the top (for both `:root` and `[data-color-scheme=dark]`)
2. Color-specific palette definitions below (e.g., `[data-palette=indigo]`, `[data-palette=rose]`, etc.)

## Steps

### 1. Create the palettes directory

Create a `palettes/` subdirectory within the theme's `src/` directory:

```bash
mkdir -p src/palettes
```

### 2. Generate individual CSS files for each color

For each color palette defined in `palettes.css`:

1. Create a new file `palettes/<colorname>.css`
2. Merge the color-independent general CSS with the color-specific palette:
   - Start with the `:root` section from the top
   - Insert the color-specific primary values into the `/* primary */` section
   - Add any color-specific calendar content properties to the `/* calendar content */` section
   - Include the complete `[data-color-scheme=dark]` section
   - If the color has dark-mode-specific overrides, merge those into the dark section as well

**Important**: Merge same-named sections (like `/* primary */`) - don't leave empty comment sections unless they exist in the original.

### 3. Create TypeScript files for each palette

For each color palette, create a corresponding TypeScript file `palettes/<colorname>.ts` that imports the CSS:

```typescript
import './<colorname>.css'
```

### 4. Update package.json exports

In the theme's `package.json`, add export entries for each palette in the `buildConfig.exports` section:

```json
"./palettes/<colorname>": {
  "iife": true,
  "css": true
}
```

Add one entry for each color palette.

### 5. Update the clean-dist script

If the theme has a `clean-dist` script in `package.json` that cleans up palette build artifacts, update it to use wildcards:

**Before:**
```json
"clean-dist": "rm -f dist/palettes.js dist/palettes.min.js dist/palettes.css.js"
```

**After:**
```json
"clean-dist": "rm -f dist/palettes/*.js dist/palettes/*.min.js dist/palettes/*.css.js"
```

### 6. Delete the main palettes.ts file

Since individual palette TypeScript files now exist, delete the main `src/palettes.ts` file (if it exists).

## Example Result

After completing these steps, the directory structure should look like:

```
src/
  palettes/
    indigo.css
    indigo.ts
    rose.css
    rose.ts
    emerald.css
    emerald.ts
    honey.css
    honey.ts
  palettes.css  (original file, kept for reference or can be removed)
```

And the package.json should have exports like:

```json
"buildConfig": {
  "exports": {
    "./palettes/indigo": {
      "iife": true,
      "css": true
    },
    "./palettes/rose": {
      "iife": true,
      "css": true
    },
    // ... etc
  }
}
```

## Notes

- The original `palettes.css` file can be kept for reference or removed depending on whether it's still needed by the build system
- Each palette becomes independently importable, allowing users to import only the specific color palette they need
- The `iife` format ensures the palettes work in browser environments
- The `css: true` flag ensures the CSS is bundled with the JavaScript output

