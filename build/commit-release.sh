#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

./build/require-clean-working-tree.sh

read -p "Enter the new version number with no 'v' (for example '1.0.1'): " version

if [[ ! "$version" ]]
then
	exit
fi

# bump version number in .json files
gulp bump --version="$version"

# TODO: make karma and dist part of same task, so ctl+C kills all
# NOTE: dist will clean first
gulp dist
gulp karmaSingle

# save reference to current branch
orig_ref=$(git symbolic-ref -q HEAD)

# make a tagged detached commit of the dist files
# no-verify avoids commit hooks
git checkout --detach --quiet
git add *.json
git add -f dist/*.js dist/*.css
git commit -e -m "version $version"
git tag -a "v$version" -m "version $version"

# go back original branch
# need to reset so dist files are not staged
git symbolic-ref HEAD "$orig_ref"
git reset
