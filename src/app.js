import fs from 'fs'
import path from 'path'
import http from 'http'
import { loadFile } from './utils.js'
import { getPacketFromResponse } from './directions-api.js'
import { getStops } from './clients/sqlite.js'
import { StopsOptionList } from './renderer/html-elements.js'

const port = process.env.PORT || 3000
const host = 'localhost'
const HOMEPAGE_FP = 'static/index.html'

// Temporary - load sample response
const API_RESPONSE_FILE = 'test-data/grant-to-lodge-to-hanvoer.json'
const response = JSON.parse(await loadFile(API_RESPONSE_FILE))
const packet = getPacketFromResponse(response)

function servePacket (res) {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.statusCode = 200
  res.write(packet.toString())
  res.end()
}

function serveStaticFile (res, filepath) {
  try {
    const stream = fs.createReadStream(filepath)
    res.statusCode = 200
    stream.pipe(res)
  } catch {
    serveNotFound()
  }
}

function serveStopsList (res) {
  const stopsOptions = new StopsOptionList(getStops())

  res.statusCode = 200
  res.write(stopsOptions.toString())
  res.end()
}

function serveNotFound (res) {
  res.statusCode = 404
  res.end()
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  console.log(`Request receieved for ${requestUrl}`)

  const isRoute = String.prototype.startsWith.bind(requestUrl.pathname)
  if (requestUrl.pathname === '/') {
    const filepath = path.join(path.resolve(), '/', HOMEPAGE_FP)
    serveStaticFile(res, filepath)
  } else if (isRoute('/static')) {
    // Protects against directory traversal! See https://url.spec.whatwg.org/#path-state
    const filepath = path.join(path.resolve(), '/', requestUrl.pathname)
    serveStaticFile(res, filepath)
  } else if (isRoute('/stops')) {
    serveStopsList(res)
  } else if (isRoute('/packet')) {
    servePacket(res)
  } else {
    serveNotFound(res)
  }
})

server.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})
