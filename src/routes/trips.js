import * as sqlite from '../clients/sqlite.js'
import * as renderer from '../renderer/html-renderer.js'
import * as responses from '../responses.js'

export async function get (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const format = requestUrl.searchParams.get('format')
  const trips = sqlite.getAllTrips()

  if (format === 'table') {
    const tripsTable = renderer.tripsTable(trips)
    responses.serveAsString(res, tripsTable)
  }

  if (format === 'options') {
    const tripsOptions = renderer.tripsOptions(trips)
    responses.serveAsString(res, tripsOptions)
  }
}
