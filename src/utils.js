import fs from 'fs/promises'

// https://stackoverflow.com/questions/10623798/how-do-i-read-the-contents-of-a-node-js-stream-into-a-string-variable
export function streamToString (stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

export async function loadFile (filepath) {
  return fs
    .readFile(filepath, { encoding: 'utf8' })
    .then((file) => file.toString())
}

/** Custom sorting function for trips.
 *
 * Trips have names like A32, A146, B52, and so on. Say you have those three in
 * an array: if you sorted these naturally, you'd get something like [A146,
 * A31, B52], even though what you really want is [A31, A146, B52], because 31
 * is less than 146. This function implements that sort.
 *
 * Note that this assumes that only the only letter is the first character in
 * the string. This is currently true of all trips (which only go up to J), and
 * will be true as long as FYT retains its current structure.
 */
export function tripSort (a, b) {
  if (a.length < 2 || b.length < 2) return

  const firstLetterComp = a[0].localeCompare(b[0])
  return firstLetterComp !== 0
    ? firstLetterComp
    : parseInt(a.slice(1)) - parseInt(b.slice(1))
}
