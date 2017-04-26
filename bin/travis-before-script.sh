#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

if [[ -f 'fullcalendar-branch.txt' ]]
then
	branch=`cat 'fullcalendar-branch.txt'`

	if [[ ! -d "fullcalendar" ]]
	then
		echo "Creating fullcalendar directory."
		mkdir "fullcalendar"
	fi

	cd "fullcalendar"

	if [[ ! -d ".git" ]]
	then
		echo "Cloning fresh fullcalendar repo."
		git clone "https://github.com/fullcalendar/fullcalendar.git" .
	else
		echo "Fetching latest from fullcalendar repo."
		git fetch origin
	fi

	echo "Checking out '$branch' branch."
	git checkout --quiet "origin/$branch"

	# already in the 'fullcalendar' directory
	# build the dist files
	npm install
	gulp dist

	cd "../node_modules"

	# remove symlink if its already there
	rm -rf "fullcalendar"

	echo "Creating symlink."
	ln -s "../fullcalendar" "fullcalendar"

else

	if [[ -d "fullcalendar" ]]
	then
		echo "Removing the nested fullcalendar git project."
		rm -rf "fullcalendar"
	fi
fi
