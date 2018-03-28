#!/usr/bin/env bash
#
# Give a --recent-release flag to test against the currently live release
#
set -e # always immediately exit upon error
cd "`dirname $0`/.." # start in project root

proj_dir="$PWD"

if [[ "$1" == '--recent-release' ]]
then
  use_current=0
else
  use_current=1

  # temporarily make this fullcalendar-scheduler project global
  npm link

  # temporarily make the fullcalendar core project global
  cd fullcalendar
  npm link
  cd "$proj_dir"
fi

success=1

for example_path in tests/example-repos/*
do
  # has npm build system? then build
  if [[ -f "$example_path/package.json" ]]
  then
    cd "$example_path"

    npm install

    # link to the globally linked fullcalendar
    if [[ "$use_current" == '1' ]]
    then
      npm link fullcalendar
      npm link fullcalendar-scheduler
    fi

    if npm run build
    then
      echo
      echo "Successfully built `basename $example_path`"
      echo
    else
      echo
      echo "Failed to build `basename $example_path`"
      echo
      success=0
    fi

    # unlink from the globally linked fullcalendar
    # don't use npm-unlink because it will remove entry from package.json
    if [[ "$use_current" == '1' ]]
    then
      rm 'node_modules/fullcalendar'
      rm 'node_modules/fullcalendar-scheduler'
    fi
  fi

  # return to project root, for next iteraion, and for after loop
  cd "$proj_dir"
done

if [[ "$use_current" == '1' ]]
then
  # unlink global fullcalendar-scheduler
  npm unlink

  # unlink global fullcalendar
  cd fullcalendar
  npm unlink
  cd "$proj_dir"
fi

if [[ "$success" == '1' ]]
then
  echo
  echo "Successfully built all example repos."
  echo
else
  echo
  echo "Failed to build all example repos."
  echo
  exit 1
fi
