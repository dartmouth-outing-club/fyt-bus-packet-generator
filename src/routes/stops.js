import * as sqlite from '../clients/sqlite.js'
import * as responses from '../responses.js'

export async function get (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const format = requestUrl.searchParams.get('format')

  switch (format) {
    case 'table':
      return responses.serveHtml(req, res, stopsTable(sqlite.getAllStopsWithStats()))
    case 'options':
      return responses.serveHtml(req, res, stopsOptionList(sqlite.getAllStops()))
    default:
      return responses.serveBadRequest(req, res)
  }
}

/** Rendering Functions **/
function stopsOptionList (stops) {
  return stops.map(stop => `<option>${stop.name}`).join('\n')
}

function stopsTable (stops) {
  const stopsHtml = stops.map((stop) => `<tr><td>${stop.name}<td>${stop.packets_present}`).join('\n')
  return `<table>
<tr><th>Stop Name<th>Packets Present
${stopsHtml}
</table>
`
}

