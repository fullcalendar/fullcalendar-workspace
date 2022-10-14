#!/usr/bin/env node

import { ensureTsMeta } from '../lib/typescript.js'

await ensureTsMeta(process.cwd())
