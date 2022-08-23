import * as html from '../renderer/html-renderer.js'
import * as sqlite from '../clients/sqlite.js'
import * as google from '../clients/google-client.js'
import * as queries from '../queries.js'
import * as utils from '../utils.js'
import * as responses from '../responses.js'

import { buildPacket } from '../directions-api.js'

export async function get (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const name = decodeURI(requestUrl.pathname).split('/').at(3)

  // If no name is specified, serve the whole packets list in the requesed format
  if (!name) {
    const format = requestUrl.searchParams.get('format')
    switch (format) {
      case 'links': {
        const names = sqlite.getAllPacketNames()
        const links = html.packetLinkList(names)
        return responses.serveAsString(req, res, links)
      }
      case 'table': {
        const packets = sqlite.getAllPacketsWithStats()
        const table = html.packetsTable(packets)
        return responses.serveAsString(req, res, table)
      }
      default:
        console.warn(`Unkown format specified: ${format}`)
        return responses.serveNotFound(req, res)
    }
  }

  // Otherwise, serve the packet in the requesed format
  if (requestUrl.searchParams.has('queryOnly')) {
    const { query } = sqlite.getPacket(name)
    return responses.serveAsString(req, res, query)
  } else {
    const packetHtml = sqlite.getPacket(name)?.html_content
    return responses.serveHtml(req, res, packetHtml)
  }
}

export async function post (req, res) {
  const body = await utils.streamToString(req)
  console.log(`Generating packet from query:\n${body}`)

  try {
    await generatePacket(body)
    responses.redirect(req, res, '/')
  } catch (err) {
    // TODO: Add more granular errors
    // i.e. A query parse failure is a bad request, google maps is bad gateway, etc
    console.error(err)
    responses.serveServerError(req, res)
  }
}

export async function del (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const name = decodeURI(requestUrl.pathname).split('/').at(3)

  if (sqlite.deletePacket(name)) {
    return responses.serveNoContent(req, res)
  } else {
    return responses.serveBadRequest(req, res)
  }
}

export async function generatePacket (body) {
  const { name, date, stopNames, tripsOnboard } = queries.parseQuery(body)
  const stops = stopNames.map(sqlite.getStop)
  const trips = tripsOnboard.map(trip => (
    { ...trip, num_students: sqlite.getTrip(trip.name)?.num_students }
  ))
  const edgeListOfStops = queries.makeEdgeList(stops)

  // Create a list of promises that will resolve the directions between each pair of stops
  const directionsPromises = edgeListOfStops.map(([start, end]) => {
    const directions = sqlite.getDirections(start.coordinates, end.coordinates)
    return directions
      ? Promise.resolve(directions)
      : google.getDirections(start.coordinates, end.coordinates)
  })
  const directionsList = await Promise.all(directionsPromises)

  const monthDay = `${date.getMonth()}-${date.getDate()}`
  const title = name || `${stops.at(0).name} - ${stops.at(-1).name} (${monthDay})`
  const packet = buildPacket(stops, directionsList, title, date, trips)
  sqlite.savePacket(title, body, packet.toString(), trips, stopNames)
}
