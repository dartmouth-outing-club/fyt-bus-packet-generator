import http from 'node:http'

import * as html from './renderer/html-renderer.js'
import * as responses from './responses.js'
import * as sqlite from './clients/sqlite.js'
import * as google from './clients/google-client.js'
import * as queries from './queries.js'
import { buildPacket } from './directions-api.js'

const env = process.env.NODE_ENV
const port = process.env.PORT || 3000
const host = 'localhost'

const STATIC_FILE_WARNING = `Error - your server is not configured correctly.
All requests to this server should be prefixed with /api/, but this one was not.
Check your nginx configuration and ensure that only /api/ requests get sent here.`

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

async function createPacket (res, body) {
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

export function handleStopsRoute (_req, res) {
  const stopsOptions = html.stopsOptionList(sqlite.getAllStops())
  responses.serveAsString(res, stopsOptions)
}

export async function handlePacketRoute (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)

  switch (req.method) {
    case 'POST': {
      const body = await streamToString(req)
      return createPacket(res, body)
    }
    case 'GET': {
      // Technically there is an opportunity for XSS here
      // We don't have any cookies to be stolen with XSS, but it's worth fixing nonetheless
      const name = decodeURI(requestUrl.pathname).split('/')[3]
      return name ? servePacket(res, name) : servePacketList(res)
    }
    case 'DELETE': {
      const name = decodeURI(requestUrl.pathname).split('/')[3]
      sqlite.deletePacket(name)
      return responses.serveNoContent(res)
    }
    default:
      return responses.serveNotAllowed(res)
  }
}

export function handleNonApiRoute (req, res) {
  if (env !== 'development') {
    console.error(STATIC_FILE_WARNING)
    return responses.serveNotFound(res)
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  return responses.serveStaticFile(res, requestUrl.pathname)
}

const app = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  console.log(`${req.method} request receieved for ${requestUrl}`)
  const subRoutes = requestUrl.pathname.split('/')

  // If the route doesn't start with /api, it's a static route
  if (subRoutes[1] !== 'api') return handleNonApiRoute(req, res)

  // If it start with /api, send it to the appropriate API handler
  switch (subRoutes[2]) {
    case 'stops':
      handleStopsRoute(req, res)
      break
    case 'packet':
      handlePacketRoute(req, res)
      break
    default:
      responses.serveNotFound(res)
  }
})

app.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})

// TODO Add "on crash" listener
