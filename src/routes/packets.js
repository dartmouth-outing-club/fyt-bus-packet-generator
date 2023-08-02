import nunjucks from 'nunjucks'

import * as sqlite from '../clients/sqlite.js'
import * as google from '../clients/google-client.js'
import * as queries from '../queries.js'
import * as utils from '../utils.js'
import * as responses from '../responses.js'

import { buildPacket } from '../packets/packet-builder.js'

export async function get (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const id = requestUrl.pathname.split('/').at(2)

  // If no name is specified, serve the whole packets list in the requesed format
  if (!id) {
    const format = requestUrl.searchParams.get('format')
    switch (format) {
      default: {
        const packets = sqlite.getAllPacketsWithStats()
        const html = nunjucks.render('src/views/packets.njk', { packets })
        return responses.serveHtml(req, res, html)
      }
    }
  }

  // Otherwise, serve the packet in the requesed format
  if (requestUrl.searchParams.has('queryOnly')) {
    const { query } = sqlite.getPacket(id)
    return responses.serveHtml(req, res, query)
  } else {
    const packetHtml = sqlite.getPacket(id)?.html_content
    return responses.serveHtml(req, res, packetHtml)
  }
}

export async function post (req, res) {
  const body = await utils.streamToString(req)
  try {
    await generatePacket(body)
    responses.hxRedirect(req, res, '/')
  } catch (err) {
    // TODO: Add more granular errors
    // i.e. A query parse failure is a bad request, google maps is bad gateway, etc
    console.error(err)
    responses.serveServerError(req, res)
  }
}

export async function put (req, res) {
  const body = await utils.streamToString(req)
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const id = requestUrl.pathname.split('/').at(2)
  if (!id) return responses.serveBadRequest(req, res)

  try {
    await generatePacket(body, id)
    responses.hxRedirect(req, res, '/')
  } catch (err) {
    // TODO: Add more granular errors
    // i.e. A query parse failure is a bad request, google maps is bad gateway, etc
    console.error(err)
    responses.serveServerError(req, res)
  }
}

export async function del (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const id = requestUrl.pathname.split('/').at(2)

  if (sqlite.deletePacket(id)) {
    return responses.serveHtml(req, res, '')
  } else {
    return responses.serveBadRequest(req, res)
  }
}

export async function generatePacket (body, id) {
  if (id) {
    console.log(`Packet #${id} already exists - replacing it`)
    sqlite.deletePacket(id)
  }

  console.log(`Generating packet from query:\n${body}`)

  const { name, date, stopNames, tripsOnboard, notes } = queries.parseQuery(body)
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
  const packet = buildPacket(stops, directionsList, title, date, trips, notes)
  sqlite.savePacket(title, body, packet.toString(), trips, stopNames, id)
}
