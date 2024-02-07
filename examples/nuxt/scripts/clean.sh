#!/bin/bash

# exit upon error
set -e

# always start in project root
cd "`dirname $0`/.."

rm -rf node_modules package-lock.json .nuxt
