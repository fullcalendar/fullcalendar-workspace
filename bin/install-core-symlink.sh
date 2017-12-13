#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

if [[ -L 'fullcalendar' ]]; then
  echo "Symlink already created."
  exit
fi

if [[ -d 'fullcalendar' ]]; then
  echo "Please clear 'fullcalendar' repo first."
  exit 1
fi

if [[ ! -d '../fullcalendar' ]]; then
  echo "Must be a 'fullcalendar' directory in sibling directory."
  exit 1
fi

ln -s '../fullcalendar' 'fullcalendar'

echo "Successfully created symlink."
