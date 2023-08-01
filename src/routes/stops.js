import nunjucks from 'nunjucks'
import * as sqlite from '../clients/sqlite.js'
import * as responses from '../responses.js'

export async function get (req, res) {
  const stops = sqlite.getAllStopsWithStats()
  const html = nunjucks.render('src/views/stops.njk', { stops })
  return responses.serveHtml(req, res, html)
}
