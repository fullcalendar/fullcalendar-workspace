#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

./build/require-clean-working-tree.sh

tag="$(git tag --points-at HEAD)"

if [[ ! "$tag" ]]
then
	echo "There must be a tag pointing at the current commit."
	exit 1
fi

read -p "Are you sure you want to publish $tag (y/n): " yn
if [[ "$yn" != "y" ]]
then
	echo "Aborting."
	exit 1
fi

# push the current branch (assumes tracking is set up) and the tag
git push
git push origin "$tag"

npm publish

echo "DONE"
