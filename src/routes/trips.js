import * as sqlite from '../clients/sqlite.js'
import * as renderer from '../renderer/html-renderer.js'
import * as responses from '../responses.js'

export async function get (_req, res) {
  const trips = sqlite.getAllTrips()
  const tripsTable = renderer.tripsTable(trips)
  responses.serveAsString(res, tripsTable)
}
