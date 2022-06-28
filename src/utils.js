import fs from 'fs/promises'

export async function loadFile (filepath) {
  return fs
    .readFile(filepath, { encoding: 'utf8' })
    .then((file) => file.toString())
}
