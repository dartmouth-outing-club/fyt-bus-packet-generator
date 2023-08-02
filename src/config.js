import fs from 'node:fs'

export function loadEnv () {
  let configString
  try {
    configString = fs.readFileSync('./.env').toString()
  } catch (error) {
    throw new Error('WARNING: Failed to open config file - ensure that .env is in the source root.')
  }

  // Add configs to process.env
  configString.split(/\r?\n/)
    .filter((line) => line.includes('='))
    .map((line) => line.split('='))
    .forEach(([key, value]) => { process.env[key] = value })
}
