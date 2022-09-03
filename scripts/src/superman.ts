import { cli } from 'cleye'

export default async function(rawArgs: string[]) {
  const argv = cli({
    name: 'superman',
    parameters: [
      '<hero>'
    ]
  }, undefined, rawArgs)

  console.log('superman argv', argv)
}
