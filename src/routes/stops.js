import * as html from '../renderer/html-renderer.js'
import * as sqlite from '../clients/sqlite.js'
import * as responses from '../responses.js'

export async function get (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const format = requestUrl.searchParams.get('format')

  switch (format) {
    case 'table':
      return responses.serveAsString(req, res, html.stopsTable(sqlite.getAllStopsWithStats()))
    case 'options':
      return responses.serveAsString(req, res, html.stopsOptionList(sqlite.getAllStops()))
    default:
      return responses.serveBadRequest(req, res)
  }
}
