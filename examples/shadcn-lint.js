#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const examplesRoot = path.join(repoRoot, 'examples');
const standardReactPackagePath = path.join(repoRoot, 'standard', 'packages', 'react', 'package.json');

const defaultExampleDirs = ['shadcn-event-calendar', 'shadcn-scheduler'];
const exampleDirs = [...defaultExampleDirs, ...process.argv.slice(2)];
const forbiddenInjectedPackages = ['@fullcalendar/react', '@fullcalendar/react-scheduler'];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

function resolvePackageRoot(exampleDir) {
  return path.isAbsolute(exampleDir) ? exampleDir : path.join(examplesRoot, exampleDir);
}

function assert(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

function resolveRealpath(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch (error) {
    throw new Error(`Failed to resolve ${filePath}: ${error.message}`);
  }
}

const standardReactPackage = readJson(standardReactPackagePath);
const expectedReactVersion = standardReactPackage.devDependencies?.react;
const expectedReactDomVersion = standardReactPackage.devDependencies?.['react-dom'];
const standardNodeModules = path.join(repoRoot, 'standard', 'packages', 'react', 'node_modules');
const errors = [];

for (const exampleDir of exampleDirs) {
  const exampleRoot = resolvePackageRoot(exampleDir);
  const packageJsonPath = path.join(exampleRoot, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    errors.push(`Missing package.json for example directory: ${exampleDir}`);
    continue;
  }

  const packageJson = readJson(packageJsonPath);
  for (const packageName of forbiddenInjectedPackages) {
    const injectedMeta = packageJson.dependenciesMeta?.[packageName];

    assert(
      injectedMeta?.injected !== true,
      `${packageJsonPath}: dependenciesMeta[${JSON.stringify(packageName)}].injected must not be true`,
      errors,
    );
  }

  assert(
    packageJson.dependencies?.react === expectedReactVersion,
    `${packageJsonPath}: react version must exactly match ${JSON.stringify(expectedReactVersion)} from ${standardReactPackagePath}`,
    errors,
  );

  assert(
    packageJson.dependencies?.['react-dom'] === expectedReactDomVersion,
    `${packageJsonPath}: react-dom version must exactly match ${JSON.stringify(expectedReactDomVersion)} from ${standardReactPackagePath}`,
    errors,
  );
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  for (const exampleDir of exampleDirs) {
    const exampleRoot = resolvePackageRoot(exampleDir);
    const exampleNodeModules = path.join(exampleRoot, 'node_modules');

    for (const packageName of ['react', 'react-dom']) {
      try {
        const exampleResolved = resolveRealpath(path.join(exampleNodeModules, packageName));
        const standardResolved = resolveRealpath(path.join(standardNodeModules, packageName));

        assert(
          exampleResolved === standardResolved,
          `${path.join(exampleRoot, 'node_modules', packageName)} resolves to ${exampleResolved}, expected ${standardResolved}`,
          errors,
        );
      } catch (error) {
        errors.push(error.message);
      }
    }
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('shadcn-lint: ok');
  }
}
