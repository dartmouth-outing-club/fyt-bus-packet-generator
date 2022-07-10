import * as renderer from '../renderer/html-renderer.js'
import * as responses from '../responses.js'

export async function get (_req, res) {
  const tripsTable = renderer.tripsTable()
  responses.serveAsString(res, tripsTable)
}
