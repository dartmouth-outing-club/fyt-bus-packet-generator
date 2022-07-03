import fs from 'node:fs'

export function serveAsString (res, object) {
  res.statusCode = 200
  res.write(object.toString())
  res.end()
}

export function serveStaticFile (res, filepath) {
  const stream = fs.createReadStream(filepath)
  stream.on('error', () => serveNotFound(res))
  res.statusCode = 200
  stream.pipe(res)
}

function setCodeAndEnd (res, code) {
  res.statusCode = code
  res.end()
}

export const serveNoContent = (res) => setCodeAndEnd(res, 204)

export const serveBadRequest = (res) => setCodeAndEnd(res, 400)

export const redirect = (res, url) => { res.setHeader('location', url); setCodeAndEnd(res, 302) }

export const serveNotFound = (res) => setCodeAndEnd(res, 404)

export const serveNotAllowed = (res) => setCodeAndEnd(res, 405)
