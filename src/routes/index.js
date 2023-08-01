import nunjucks from 'nunjucks'

import * as sqlite from '../clients/sqlite.js'
import * as responses from '../responses.js'

export function get (req, res) {
  const packets = sqlite.getAllPackets()
  const trips = sqlite.getAllTrips()
  const html = nunjucks.render('src/views/index.njk', { trips, packets })
  responses.serveHtml(req, res, html)
}
