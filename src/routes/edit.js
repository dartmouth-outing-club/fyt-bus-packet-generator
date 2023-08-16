import nunjucks from 'nunjucks'
import * as responses from '../responses.js'
import * as sqlite from '../clients/sqlite.js'

export async function get (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const id = requestUrl.pathname.split('/').at(2)

  if (!id) return responses.serveBadRequest(req, res)

  const packet = sqlite.getPacket(id)
  const trips = sqlite.getAllTrips()
  const stops = sqlite.getAllStopsWithStats()

  // Because we insert this value directely into the javascript, we have to escape the single quotation
  packet.query = packet.query.replace("'", "\\'")

  const html = nunjucks.render('src/views/edit.njk', { packet, trips, stops })
  return responses.serveHtml(req, res, html)
}
