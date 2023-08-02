import fs from 'node:fs'
import path from 'node:path'

const ONE_DAY_IN_SECONDS = 86400

function setMimeType (res, pathname) {
  if (pathname.endsWith('.html')) {
    res.setHeader('Content-Type', 'text/html')
  } else if (pathname.endsWith('.js')) {
    res.setHeader('Content-Type', 'text/javascript')
  } else if (pathname.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css')
  }
}

function setCodeAndEnd (res, code) {
  const body = `<!DOCTYPE html>
<title>${code}</title>
<main style="text-align:center">
<h1>${code}</h1>
<hr>
<p>Click <a href="/">here</a> to return to the homepage
</main>
`
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.statusCode = code
  res.write(body)
  res.end()
}

function pipeFile (res, filepath, code = 200) {
  res.statusCode = code
  const stream = fs.createReadStream(filepath)
  stream.on('error', () => serveNotFound(res))
  stream.on('end', () => res.end())
  stream.pipe(res)
}

export function serveAsString (_req, res, object) {
  res.statusCode = 200
  res.write(object.toString())
  res.end()
}

// Don't use user-generated pathnames, only absolute ones
export function serveDistFile (_req, res, pathname, cacheTime = ONE_DAY_IN_SECONDS) {
  res.setHeader('Cache-Control', `max-age=${cacheTime}`)
  setMimeType(res, pathname)
  pipeFile(res, pathname)
}

export function serveStaticFile (_req, res, pathname, cacheTime = ONE_DAY_IN_SECONDS) {
  // Protects against directory traversal! See https://url.spec.whatwg.org/#path-state
  const filepath = path.join(path.resolve(), '/static', pathname)
  res.setHeader('Cache-Control', `max-age=${cacheTime}`)
  setMimeType(res, pathname)
  pipeFile(res, filepath)
}

export function serveSuccessMessage (_req, res, message) {
  const body = `<div class=success onclick="this.remove()"><p>${message}</div>`
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.statusCode = 200
  res.write(body)
  res.end()
}

export function serveErrorMessage (_req, res, message, code) {
  const body = `<div class=error onclick="this.remove()"><p>${message}</div>`
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.statusCode = code
  res.write(body)
  res.end()
}

export function serveHtml (req, res, text) {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  serveAsString(req, res, text)
}

export function redirect (_req, res, url) {
  res.setHeader('location', url)
  setCodeAndEnd(res, 302)
}

export function hxRedirect (_req, res, url) {
  res.setHeader('HX-Redirect', url)
  setCodeAndEnd(res, 200)
}

export const serveNoContent = (_req, res) => setCodeAndEnd(res, 204)
export const serveBadRequest = (_req, res) => setCodeAndEnd(res, 400)
export const serveNotFound = (_req, res) => setCodeAndEnd(res, 404)
export const serveNotAllowed = (_req, res) => setCodeAndEnd(res, 405)
export const serveServerError = (_req, res) => setCodeAndEnd(res, 500)
