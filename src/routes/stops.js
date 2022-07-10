import * as html from '../renderer/html-renderer.js'
import * as sqlite from '../clients/sqlite.js'
import * as responses from '../responses.js'

export async function get (_req, res) {
  const stopsOptions = html.stopsOptionList(sqlite.getAllStops())
  responses.serveAsString(res, stopsOptions)
}
