import fs from 'node:fs'
import path from 'node:path'

const pagePath = (staticFp) => path.join(path.resolve(), '/static', staticFp)

const HOMEPAGE_FP = pagePath('index.html')
const ERROR_FP = pagePath('404.html')

function setMimeType (res, pathname) {
  if (pathname.endsWith('.html')) {
    res.setHeader('Content-Type', 'text/html')
  } else if (pathname.endsWith('.js')) {
    res.setHeader('Content-Type', 'text/javascript')
  } else if (pathname.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css')
  }
}

function setCodeAndEnd (res, code, body) {
  if (body) res.write(body)
  res.statusCode = code
  res.end()
}

function pipeFile (res, filepath, code = 200) {
  const stream = fs.createReadStream(filepath)
  stream.on('error', () => serveNotFound(res))
  stream.on('end', () => res.end())
  res.statusCode = code
  stream.pipe(res)
}

function pipeHtmlFile (res, filepath, code = 200) {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  pipeFile(res, filepath, code)
}

export function serveAsString (res, object) {
  res.statusCode = 200
  res.write(object.toString())
  res.end()
}

export function serveStaticFile (res, pathname) {
  // Protects against directory traversal! See https://url.spec.whatwg.org/#path-state
  let filepath = path.join(path.resolve(), '/static', pathname)
  if (pathname === '/') return serveHomepage(res)
  // Serve the html file if there's no file extension in the path
  if (!pathname.includes('.')) filepath += '.html'
  setMimeType(res, pathname)

  pipeFile(res, filepath)
}

export function serveSuccessMessage (res, message) {
  const body = `<div class=success onclick="this.remove()"><p>${message}</div>`
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.statusCode = 200
  res.write(body)
  res.end()
}

export function serveErrorMessage (res, message, code) {
  const body = `<div class=error onclick="this.remove()"><p>${message}</div>`
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.statusCode = code
  res.write(body)
  res.end()
}

export function serveHtml (res, text) {
  if (text) {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    serveAsString(res, text)
  }
  serveNotFound(res)
}

export function redirect (res, url) {
  res.setHeader('location', url); setCodeAndEnd(res, 302)
}

export const serveHomepage = (res) => pipeHtmlFile(res, HOMEPAGE_FP)
export const serveNoContent = (res) => setCodeAndEnd(res, 204)
export const serveBadRequest = (res) => setCodeAndEnd(res, 400)
export const serveNotFound = (res) => pipeHtmlFile(res, ERROR_FP, 404)
export const serveNotAllowed = (res) => setCodeAndEnd(res, 405)
export const serveServerError = (res) => setCodeAndEnd(res, 500)
