import fs from 'fs'
import path from 'path'
import http from 'http'
import { loadFile } from './server/utils.js'
import { getPacketFromResponse } from './server/directions-api.js'

const port = process.env.PORT || 3000
const host = 'localhost'
const HOMEPAGE_FP = '/static/index.html'

// Temporary - load sample response
const API_RESPONSE_FILE = './test-data/grant-to-lodge-to-hanvoer.json'
const response = JSON.parse(await loadFile(API_RESPONSE_FILE))
const packet = getPacketFromResponse(response)

function servePacket (res) {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.statusCode = 200
  res.write(packet)
  res.end()
}

function serveStaticFile (res, filepath) {
  const stream = fs.createReadStream(filepath)
  res.statusCode = 200
  stream.pipe(res)
}

function serveNotFound (res) {
  res.statusCode = 404
  res.end()
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  console.log(`Request receieved for ${requestUrl}`)

  if (requestUrl.pathname === '/') {
    const filepath = path.join(path.resolve(), '/', HOMEPAGE_FP)
    serveStaticFile(res, filepath)
  } else if (requestUrl.pathname.startsWith('/static/')) {
    // Protects against directory traversal! See https://url.spec.whatwg.org/#path-state
    const filepath = path.join(path.resolve(), '/', requestUrl.pathname)
    serveStaticFile(res, filepath)
  } else if (requestUrl.pathname.startsWith('/packet')) {
    servePacket(res)
  } else {
    serveNotFound(res)
  }
})

server.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})
