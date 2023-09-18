#!/bin/bash

# exit upon error
set -e

version="6.1.8"

declare -a tag_dirs=( \
  "/Users/adam/Code/fullcalendar-workspace/contrib/standard" \
  "/Users/adam/Code/fullcalendar-workspace/contrib/angular" \
  "/Users/adam/Code/fullcalendar-workspace/contrib/react" \
  "/Users/adam/Code/fullcalendar-workspace/contrib/vue2" \
  "/Users/adam/Code/fullcalendar-workspace/contrib/vue3" \
  "/Users/adam/Code/fullcalendar-workspace" \
)

for tag_dir in ${tag_dirs[@]}; do
  echo "Pushing tag $tag in $tag_dir..."
  cd "$tag_dir"
  git tag -a "$version" -m "$version"
  git push origin "$version"
done

declare -a release_repos=( \
  "fullcalendar/fullcalendar-angular" \
  "fullcalendar/fullcalendar-react" \
  "fullcalendar/fullcalendar-vue" \
  "fullcalendar/fullcalendar-vue2" \
  "fullcalendar/fullcalendar-workspace" \
)

for release_repo in ${release_repos[@]}; do
  echo "Creating release $tag in $release_repo..."
  gh api \
    --method POST \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$release_repo/releases" \
    -f tag_name="$version" \
    -f name="$version" \
    -f body="See https://github.com/fullcalendar/fullcalendar/releases/tag/$version" \
    -f make_latest=true
done

echo
echo "DONE"
echo
echo "TODO:"
echo " - In fullcalendar/fullcalendar, create release and upload zip"
echo " - In fullcalendar/fullcalendar-workspace, upload zip"
echo
