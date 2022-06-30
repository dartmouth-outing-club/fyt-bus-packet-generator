import fs from 'node:fs'
import path from 'node:path'

import { buildPacket } from './directions-api.js'
import { PacketLinkList, StopsOptionList } from './renderer/html-renderer.js'

import * as sqlite from './clients/sqlite.js'
import * as google from './clients/google-client.js'

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

function redirect (res, newUrl) {
  res.statusCode = 302
  res.setHeader('location', newUrl)
  res.end()
}

function serveAsString (res, object) {
  res.statusCode = 200
  res.write(object.toString())
  res.end()
}

function servePacketList (res) {
  const names = sqlite.getAllPacketNames()
  const links = new PacketLinkList(names)
  serveAsString(res, links)
}

function servePacket (res, name) {
  const packet = sqlite.getPacket(name)
  if (packet) {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    serveAsString(res, packet)
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
  serveAsString(res, stopsOptions)
}

export function serveNotFound (res) {
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

  if (!coordinateList[0] || !coordinateList[1]) {
    serveNotFound(res)
  }

  console.log(`Checking cache for coorindateList: ${coordinateList}`)
  const directions = sqlite.getDirections(coordinateList) || await google.getDirections(coordinateList)
  const packet = buildPacket(directions)
  sqlite.savePacket(name, packet.toString())

  redirect(res, '/')
}

export function handleRoot (_req, res) {
  const filepath = path.join(path.resolve(), '/', HOMEPAGE_FP)
  serveStaticFile(res, filepath)
}

export function handleStopsRoute (_req, res) {
  serveStopsList(res)
}

export function handleStaticRoute (req, res) {
  // Protects against directory traversal! See https://url.spec.whatwg.org/#path-state
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const filepath = path.join(path.resolve(), '/', requestUrl.pathname)
  serveStaticFile(res, filepath)
}

export function handlePacketRoute (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'POST') {
    handlePacketPost(req, res)
  } else {
    const name = decodeURI(requestUrl.pathname).split('/')[2]
    if (name) {
      servePacket(res, name)
    } else {
      // Technically there is an opportunity for XSS here
      // We don't have any cookies to be stolen with XSS, but it's worth removing nonetheless
      servePacketList(res)
    }
  }
}
