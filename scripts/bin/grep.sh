#!/bin/bash

set -e
cd "`dirname $0`/../.."

grep -n --color=auto -r -E $1 */packages/*/src
