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

  if (!name) {
    const names = sqlite.getAllPacketNames()
    const links = html.packetLinkList(names)
    responses.serveAsString(res, links)
  } else if (requestUrl.searchParams.has('queryOnly')) {
    const { query } = sqlite.getPacket(name)
    return responses.serveAsString(res, query)
  } else {
    const packetHtml = sqlite.getPacket(name)?.html_content
    return responses.serveHtml(res, packetHtml)
  }
}

export async function post (req, res) {
  const body = await utils.streamToString(req)

  let params
  try {
    params = queries.parseQuery(body)
  } catch (err) {
    console.error(err)
    return responses.serveBadRequest(res)
  }

  const { name, date, stopNames, tripsOnboard } = params
  console.log(`Getting stop information for: ${stopNames}`)
  const stops = stopNames.map(sqlite.getStop)
  const trips = tripsOnboard.map(trip => (
    { ...trip, num_students: sqlite.getTrip(trip.name)?.num_students }
  ))
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

  const title = name || `From ${stopNames.at(0)} to ${stopNames.at(-1)} (${stopNames.length - 2} stops)`
  const packet = buildPacket(stops, directionsList, title, date, trips)
  sqlite.savePacket(title, body, packet.toString())
  sqlite.savePacketTrips(title, trips)
  responses.redirect(res, '/')
}

export async function del (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const name = decodeURI(requestUrl.pathname).split('/').at(3)

  if (sqlite.deletePacket(name)) {
    return responses.serveNoContent(res)
  } else {
    return responses.serveBadRequest(res)
  }
}
