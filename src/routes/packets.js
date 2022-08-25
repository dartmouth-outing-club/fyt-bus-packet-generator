import * as sqlite from '../clients/sqlite.js'
import * as google from '../clients/google-client.js'
import * as queries from '../queries.js'
import * as utils from '../utils.js'
import * as responses from '../responses.js'

import { buildPacket } from '../packets/packet-builder.js'

export async function get (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const name = decodeURI(requestUrl.pathname).split('/').at(3)

  // If no name is specified, serve the whole packets list in the requesed format
  if (!name) {
    const format = requestUrl.searchParams.get('format')
    switch (format) {
      case 'links': {
        const names = sqlite.getAllPacketNames()
        const links = packetLinkList(names)
        return responses.serveHtml(req, res, links)
      }
      case 'table': {
        const packets = sqlite.getAllPacketsWithStats()
        const table = packetsTable(packets)
        return responses.serveHtml(req, res, table)
      }
      default:
        console.warn(`Unkown format specified: ${format}`)
        return responses.serveNotFound(req, res)
    }
  }

  // Otherwise, serve the packet in the requesed format
  if (requestUrl.searchParams.has('queryOnly')) {
    const { query } = sqlite.getPacket(name)
    return responses.serveHtml(req, res, query)
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

function packetLinkList (names) {
  const items = names.map(name => `<li>
<button class=edit onclick="editPacket('${name}')">Edit</button>
<button class=delete onclick="deletePacket('${name}')">Delete</button>
<a href="/api/packets/${encodeURI(name)}">${name}</a>`).join('\n')

  return `<ul>
${items}
</ul>`
}

function packetsTable (packets) {
  const packetsTable = packets.map((packet) => `<tr>
<td>${packet.name}
<td>${packet.total_students}`).join('\n')

  return `<table>
<tr>
<th>Packet
<th>Total Students
${packetsTable}
</table>`
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
