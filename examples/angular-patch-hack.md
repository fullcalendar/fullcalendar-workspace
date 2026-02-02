
If we try to build certain angular projects, we get this error:

  This version of CLI is only compatible with Angular versions ^20.0.0,
  but Angular version 18.2.14 was found instead.
  Please visit the link below to find instructions on how to update Angular.
  https://update.angular.dev/

Happens in examples/angular18

Angular is buggy and confused about which version its using

Made patch in <workspace-root>/scripts/patches/@angular__build@18.patch

And wired up in <workspace-root>/package.json WITH SPECIFIC VERSION TO TARGET

If angular package versions change, need to figure out new version to apply patch to

  pnpm -r why @angular/build --depth Infinity
