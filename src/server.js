import fs from 'node:fs'
import path from 'node:path'

import { buildPacket } from './directions-api.js'

import * as html from './renderer/html-renderer.js'
import * as sqlite from './clients/sqlite.js'
import * as google from './clients/google-client.js'
import * as queries from './queries.js'

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
  const links = html.packetLinkList(names)
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
  const stream = fs.createReadStream(filepath)
  stream.on('error', () => serveNotFound(res))
  res.statusCode = 200
  stream.pipe(res)
}

function serveStopsList (res) {
  const stopsOptions = html.stopsOptionList(sqlite.getAllStops())
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

export function serveBadRequest (res) {
  res.statusCode = 400
  res.end()
}

async function createPacket (req, res) {
  const body = await streamToString(req)

  let params
  try {
    params = queries.parseQuery(body)
  } catch (err) {
    console.error(err)
    return serveBadRequest(res)
  }

  const { tripName, date, stopNames } = params
  console.log(`Getting stop information for: ${stopNames}`)
  const stops = stopNames.map(sqlite.getStop)
  const edgeListOfStops = queries.makeEdgeList(stops)

  // Create a list of promises that will resolve the directions between each pair of stops
  const directionsPromises = edgeListOfStops.map(([start, end]) => {
    const directions = sqlite.getDirections(start.coordinates, end.coordinates)

    if (directions) {
      console.log(`Cache hit for directions from ${start.name} to ${end.name}`)
      return Promise.resolve(directions)
    }

    console.log(`Cache miss for directions from ${start.name} to ${end.name}`)
    return google.getDirections(start.coordinates, end.coordinates)
  })

  const directionsList = await Promise.all(directionsPromises)
  const packet = buildPacket(stops, directionsList, tripName, date)
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

export function handlePacketRoute (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)

  switch (req.method) {
    case 'POST':
      return createPacket(req, res)
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

export function handleDefaultRoute (req, res) {
  // Protects against directory traversal! See https://url.spec.whatwg.org/#path-state
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const filepath = path.join(path.resolve(), '/static', requestUrl.pathname)
  serveStaticFile(res, filepath)
}
