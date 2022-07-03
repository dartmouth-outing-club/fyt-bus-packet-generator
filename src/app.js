import http from 'node:http'
import path from 'node:path'

import * as html from './renderer/html-renderer.js'
import * as responses from './responses.js'
import * as sqlite from './clients/sqlite.js'
import * as google from './clients/google-client.js'
import * as queries from './queries.js'
import { buildPacket } from './directions-api.js'

const env = process.env.NODE_ENV
const port = process.env.PORT || 3000
const host = 'localhost'

const HOMEPAGE_FP = 'static/index.html'
const STATIC_FILE_WARNING = 'Warining: you are running node in a non-dev environment and serving static files - you should replace that with a static file server.'

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
  const links = html.packetLinkList(names)
  responses.serveAsString(res, links)
}

function servePacket (res, name) {
  const packet = sqlite.getPacket(name)
  if (packet) {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    responses.serveAsString(res, packet)
  }
  responses.serveNotFound(res)
}

async function createPacket (req, res) {
  const body = await streamToString(req)

  let params
  try {
    params = queries.parseQuery(body)
  } catch (err) {
    console.error(err)
    return responses.serveBadRequest(res)
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
  responses.redirect(res, '/')
}

export function handleRoot (_req, res) {
  const filepath = path.join(path.resolve(), '/', HOMEPAGE_FP)
  responses.serveStaticFile(res, filepath)
}

export function handleStopsRoute (_req, res) {
  const stopsOptions = html.stopsOptionList(sqlite.getAllStops())
  responses.serveAsString(res, stopsOptions)
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
      sqlite.deletePacket(name)
      return responses.serveNoContent(res)
    }
    default:
      return responses.serveNotAllowed(res)
  }
}

export function handleDefaultRoute (req, res) {
  // Protects against directory traversal! See https://url.spec.whatwg.org/#path-state
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  let filepath = path.join(path.resolve(), '/static', requestUrl.pathname)

  // Serve the html file if there's no file extension in the path
  // Obviously this precludes serving files with no extensions; good thing we don't need to do that
  if (!requestUrl.pathname.includes('.')) filepath += '.html'
  responses.serveStaticFile(res, filepath)
}

const app = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  console.log(`${req.method} request receieved for ${requestUrl}`)
  const topRoute = requestUrl.pathname.split('/')[1]

  switch (topRoute) {
    case '':
      handleRoot(req, res)
      break
    case 'stops':
      handleStopsRoute(req, res)
      break
    case 'packet':
      handlePacketRoute(req, res)
      break
    default:
      if (env !== 'development') console.warn(STATIC_FILE_WARNING)
      handleDefaultRoute(req, res)
  }
})

app.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})
