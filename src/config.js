import fs from 'node:fs'

export const config = fs
  .readFileSync('./.env')
  .toString()
  .split(/\r?\n/)
  .filter((line) => line.includes('='))
  .map((line) => line.split('='))
  .reduce((config, line) => ({ ...config, [line[0]]: line[1] }), {})
