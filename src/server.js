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

function deletePacket (res, name) {
  sqlite.deletePacket(name)
  res.statusCode = 204
  res.end()
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
  const stopsOptions = new StopsOptionList(sqlite.getAllStops())
  serveAsString(res, stopsOptions)
}

export function serveNotAllowed (res) {
  res.statusCode = 405
  res.end()
}

export function serveNotFound (res) {
  res.statusCode = 404
  res.end()
}

async function handlePacketPost (req, res) {
  const body = await streamToString(req)
  const params = new URLSearchParams(body)

  const tripName = params.get('trip-name')
  // const date = params.get('trip-date')
  const origin = sqlite.getStop(params.get('origin-location'))
  const destination = sqlite.getStop(params.get('destination-location'))

  if (!origin || !destination) return serveNotFound(res)

  console.log(`Checking cache for start: ${origin.name}, end: ${destination.name}`)
  const directions = sqlite.getDirections(origin.coordinates, destination.coordinates) ||
    await google.getDirections(origin.coordinates, destination.coordinates)
  const packet = buildPacket(
    directions, tripName, origin.name, destination.name, destination.specialInstructions)

  sqlite.savePacket(tripName, packet.toString())
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

  switch (req.method) {
    case 'POST':
      return handlePacketPost(req, res)
    case 'GET': {
      // Technically there is an opportunity for XSS here
      // We don't have any cookies to be stolen with XSS, but it's worth removing nonetheless
      const name = decodeURI(requestUrl.pathname).split('/')[2]
      return name ? servePacket(res, name) : servePacketList(res)
    }
    case 'DELETE': {
      const name = decodeURI(requestUrl.pathname).split('/')[2]
      return deletePacket(res, name)
    }
    default:
      return serveNotAllowed(res)
  }
}
