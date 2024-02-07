#!/bin/bash

# Re-install each run
# https://github.com/ingydotnet/git-subrepo?tab=readme-ov-file#installation
source "`dirname $0`/../git-subrepo/.rc"

git-subrepo "$@"
