#!/usr/bin/env bash

cd "`dirname $0`/.."

echo
echo "THIS SCRIPT ASSUMES YOU'VE ALREADY BUMPED THE VERSION IN ALL THE .json FILES"
echo

read -p "Enter the new version number with no 'v' (for example '1.0.1'): " version

if [[ ! "$version" ]]
then
	exit
fi

gulp dist && \
gulp karmaSingle && \
git checkout `git rev-parse --verify HEAD` && \
git add -f dist/*.js dist/*.css && \
git commit -e -m "version $version" && \
git tag -a "v$version" -m "version $version" && \
git checkout master && \
echo && \
echo 'DONE. It is now up to you to run `'"git push origin master && git push origin v$version"'`' && \
echo 'and `'"git checkout v$version && npm publish"'`' && \
echo

# TODO: fix the git checkouts at the end