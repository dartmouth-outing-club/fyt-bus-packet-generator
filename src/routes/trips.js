import stream from 'node:stream'

import * as sqlite from '../clients/sqlite.js'
import * as responses from '../responses.js'
import * as utils from '../utils.js'

import csv from 'csv-parser'

export async function get (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const format = requestUrl.searchParams.get('format')
  const trips = sqlite.getAllTripsWithStats()
  trips.sort((a, b) => utils.tripSort(a.name, b.name))

  switch (format) {
    case 'table':
      return responses.serveAsString(req, res, tripsTable(trips))
    case 'options':
      return responses.serveAsString(req, res, tripsOptions(trips))
    default:
      return responses.serveBadRequest(req, res)
  }
}

export async function post (req, res) {
  const content = req.headers['content-type']
  if (content.slice(0, 20) !== 'multipart/form-data;') return responses.serveBadRequest(req, res)

  // Attempt to parse the file from the HTTP Request
  // For legitimate requests this is done by the browser, so failures are bad requests
  console.log(`Uploading file: ${content}`)
  let fileContent
  try {
    // The boundary string is preceeded by a --
    // See: https://www.rfc-editor.org/rfc/rfc7578#section-4.1
    const boundary = '--' + content.split('=')[1]
    const body = await utils.streamToString(req)
    const fileWithHeaders = body.split(boundary)[1]
    fileContent = fileWithHeaders.slice(fileWithHeaders.match(/\r\n\r\n/).index)
  } catch (error) {
    console.error('Error parsing input', error)
    return responses.serveBadRequest(req, res)
  }

  // Promisify the CSV stream and return the promise
  // This is idiomatic but I do think it's a little clunky
  // A non-stream CSV parser wouldn't have to be written like this
  const readable = stream.Readable.from([fileContent])
  const results = []
  return new Promise((resolve, reject) => {
    readable
      .pipe(csv(['name', 'num_students']))
      .on('data', data => results.push(data))
      .on('error', () => {
        responses.serveBadRequest(req, res)
        reject(new Error('Failed to parse CSV'))
      })
      // If successful, save the trips and redirect the user to the homepage
      .on('end', () => {
        const trips = results
          .filter(row => Object.keys(row).length !== 0)
          .map(row => ({ ...row, name: row.name.toUpperCase().trim() }))
          .filter(row => row.name) // Filter trips with falsy name values
        trips.map(sqlite.saveTrip)
        responses.redirect(req, res, '/trips')
        resolve()
      })
  })
}

export async function del (req, res) {
  const trip = req.url.split('/').at(3)
  try {
    sqlite.deleteTrip(trip)
    responses.serveNoContent(req, res)
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_TRIGGER') {
      responses.serveErrorMessage(req, res, 'Error: cannot delete a trip that is part of a packet', 400)
    } else {
      responses.serveServerError(req, res)
    }
  }
}

export function tripsOptions (trips) {
  return trips.map((trip) => `<option>${trip.name}</option>`).join('\n')
}

export function tripsTable (trips) {
  const tripsHtml = trips.map((trip) => `<tr>
<td>${trip.name}
<td>${trip.num_students}
<td>${trip.num_packets}
<td>${trip.packets_present}
`).join('\n')

  return `<table>
<tr>
<th>Trip Name
<th>Num Students
<th>Num Packets
<th>Packets Present

${tripsHtml}
</table>
`
}
