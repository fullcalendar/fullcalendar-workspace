#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

echo
echo 'DONE. It is now up to you to run `'"git push origin master && git push origin v$version"'`'
echo 'and `'"git checkout v$version && npm publish"'`'
echo
