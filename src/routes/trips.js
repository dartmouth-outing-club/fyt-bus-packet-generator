import stream from 'node:stream'

import * as sqlite from '../clients/sqlite.js'
import * as html from '../renderer/html-renderer.js'
import * as responses from '../responses.js'
import * as utils from '../utils.js'

import csv from 'csv-parser'

export async function get (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const format = requestUrl.searchParams.get('format')
  const trips = sqlite.getAllTrips()

  if (format === 'table') {
    const tripsTable = html.tripsTable(trips)
    responses.serveAsString(res, tripsTable)
  }

  if (format === 'options') {
    const tripsOptions = html.tripsOptions(trips)
    responses.serveAsString(res, tripsOptions)
  }

  responses.serveBadRequest(res)
}

export async function post (req, res) {
  const content = req.headers['content-type']
  if (content.slice(0, 20) !== 'multipart/form-data;') {
    responses.serveBadRequest(res)
  }
  console.log(`Uploading file: ${content}`)

  // The boundary string is preceeded by a --
  // See: https://www.rfc-editor.org/rfc/rfc7578#section-4.1
  const boundary = '--' + content.split('=')[1]
  const body = await utils.streamToString(req)
  const fileWithHeaders = body.split(boundary)[1]
  const fileContent = fileWithHeaders.slice(fileWithHeaders.match(/^\r?\n$/m).index)

  const readable = stream.Readable.from([fileContent])
  const results = []
  readable
    .pipe(csv(['name', 'num_students']))
    .on('data', data => results.push(data))
    .on('error', () => responses.serveBadRequest(res))
    .on('end', () => {
      const trips = results
        .filter(row => Object.keys(row).length !== 0)
        .map(row => ({ ...row, name: row.name.toUpperCase() }))
      trips.map(sqlite.saveTrip)
      responses.redirect(res, '/trips')
    })
}

export async function del (req, res) {
  const trip = req.url.split('/').at(3)

  try {
    sqlite.deleteTrip(trip)
    responses.serveNoContent(res)
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_TRIGGER') {
      responses.serveMessage(res, 400, "Error: cannot delete a trip that is part of a packet")
    } else {
      responses.serveServerError(res)
    }
  }
}
