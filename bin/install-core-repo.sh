#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

if [[ -f fullcalendar-branch.txt ]]; then
  CORE_REF=$(cat fullcalendar-branch.txt)
else
  CORE_REF="v$(npm show fullcalendar version)"
fi

if [[ -L 'fullcalendar' ]]; then
  echo "Clearing symlink."
  rm 'fullcalendar'
fi

if [[ -d 'fullcalendar' ]]; then
  # repo already exists? clean for upcoming checkout and rebuild
  cd fullcalendar
  echo "NOW IN DIR1:"
  pwd
  npm run clean
else
  git clone "https://github.com/fullcalendar/fullcalendar.git"
  cd fullcalendar
fi

echo "NOW IN DIR2:"
pwd

# do build tasks within fullcalendar dir
git fetch origin
git checkout -q "$CORE_REF"
npm install
npm run dist

echo "Successfully checked out $CORE_REF"
