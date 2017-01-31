#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

echo
echo "This script makes it easier for you to develop the fullcalendar core"
echo "project in tandem with fullcalendar-scheduler."
echo
echo "It will set up an npm-link to ../fullcalendar, an existing directory"
echo "that should be a sibling to the fullcalendar-scheduler directory."
echo

if [[ ! -d "../fullcalendar" ]]
then
	echo "fullcalendar directory doesn't exist."
	echo "Aborting."
	exit 1
fi

read -p "Proceed? (y/N): " proceed
if [[ "$proceed" != "y" ]]
then
	echo "Aborting."
	exit 1
fi

npm link ../fullcalendar
echo "Success."
