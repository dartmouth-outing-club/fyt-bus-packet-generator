import fs from 'fs'
import path from 'path'
import http from 'http'
import { getPacketFromResponse } from './directions-api.js'
import { PacketLinkList, StopsOptionList } from './renderer/html-elements.js'

import * as sqlite from './clients/sqlite.js'
import * as google from './clients/google-client.js'

const port = process.env.PORT || 3000
const host = 'localhost'
const HOMEPAGE_FP = 'static/index.html'

// https://stackoverflow.com/questions/10623798/how-do-i-read-the-contents-of-a-node-js-stream-into-a-string-variable
function streamToString (stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

function servePacketList (res) {
  const names = sqlite.getAllPacketNames()
  const links = new PacketLinkList(names)

  res.statusCode = 200
  res.write(links.toString())
  res.end()
}

function servePacket (res, name) {
  const packet = sqlite.getPacket(name)
  if (packet) {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    res.statusCode = 200
    res.write(packet.toString())
    res.end()
  }
  serveNotFound(res)
}

function serveStaticFile (res, filepath) {
  try {
    const stream = fs.createReadStream(filepath)
    res.statusCode = 200
    stream.pipe(res)
  } catch {
    serveNotFound(res)
  }
}

function serveStopsList (res) {
  const stopsOptions = new StopsOptionList(sqlite.getStops())

  res.statusCode = 200
  res.write(stopsOptions.toString())
  res.end()
}

function serveNotFound (res) {
  res.statusCode = 404
  res.end()
}

async function handlePacketPost (req, res) {
  const body = await streamToString(req)
  const params = new URLSearchParams(body)

  const name = params.get('trip-name')
  // const date = params.get('trip-date')

  const origin = sqlite.getCoordinatesByStopName(params.get('origin-location'))
  const destination = sqlite.getCoordinatesByStopName(params.get('destination-location'))
  const coordinateList = [origin, destination]

  console.log(`Checking cache for coorindateList: ${coordinateList}`)
  const directions = sqlite.getDirections(coordinateList) || await google.getDirections(coordinateList)
  const packet = getPacketFromResponse(directions)
  sqlite.savePacket(name, packet.toString())

  res.statusCode = 302
  res.setHeader('location', '/')
  res.end()
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  console.log(`${req.method} request receieved for ${requestUrl}`)

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
  } else if (req.method === 'POST' && isRoute('/packet')) {
    handlePacketPost(req, res)
  } else if (isRoute('/packet')) {
    const name = decodeURI(requestUrl.pathname).split('/')[2]
    if (name) {
      servePacket(res, name)
    } else {
      servePacketList(res)
    }
  } else {
    serveNotFound(res)
  }
})

server.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})
