import fs from 'node:fs'

let configString
try {
  configString = fs.readFileSync('./.env').toString()
} catch {
  console.error('Failed to open config file - ensure that .env is in the source root.')
}

export const config = configString.split(/\r?\n/)
  .filter((line) => line.includes('='))
  .map((line) => line.split('='))
  .reduce((config, line) => ({ ...config, [line[0]]: line[1] }), {})
