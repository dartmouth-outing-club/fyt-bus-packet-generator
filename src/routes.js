import * as index from './routes/index.js'
import * as packets from './routes/packets.js'
import * as edit from './routes/edit.js'
import * as stops from './routes/stops.js'
import * as trips from './routes/trips.js'
import * as regenerate from './routes/regenerate.js'
import * as directions from './routes/directions.js'
import * as responses from './responses.js'

const HTMX_ROUTE = './node_modules/htmx.org/dist/htmx.js'
const ONE_YEAR_IN_SECONDS = 3.156e+7

export function getHandler (url, httpMethod) {
  const subRoutes = url.pathname.split('/')
  if (subRoutes.at(1) === 'static') {
    if (httpMethod !== 'GET') return responses.serveBadRequest
    // Serve HTMX with a long cache time
    if (subRoutes.at(2).includes('htmx')) {
      return (req, res) => responses.serveDistFile(req, res, HTMX_ROUTE, ONE_YEAR_IN_SECONDS)
    }

    return (req, res) => responses.serveStaticFile(req, res, url.pathname.substring(7))
  }

  // Send it to the appropriate API handler
  // Note that getModuleMethodHandler returns a function that can be called later
  switch (subRoutes.at(1)) {
    case '':
      return getModuleMethodHandler(index, httpMethod)
    case 'stops':
      return getModuleMethodHandler(stops, httpMethod)
    case 'packets':
      return getModuleMethodHandler(packets, httpMethod)
    case 'edit':
      return getModuleMethodHandler(edit, httpMethod)
    case 'trips':
      return getModuleMethodHandler(trips, httpMethod)
    case 'regenerate':
      return getModuleMethodHandler(regenerate, httpMethod)
    case 'directions':
      return getModuleMethodHandler(directions, httpMethod)
    default:
      return responses.serveNotFound
  }
}

function getModuleMethodHandler (module, httpMethod) {
  // Convert the HTTP Method (GET, POST, etc) into the corresponding function
  // DELETE is converted to 'del' because 'delete' is a JS keyword
  const functionName = httpMethod === 'DELETE' ? 'del' : httpMethod.toLowerCase()
  const moduleMethodHandler = module[functionName]

  // If a function exists for that HTTP method, return it
  // Otherwise, return a function that serves 405 METHOD NOT ALLOWED
  const moduleHasMethod = typeof moduleMethodHandler === 'function'
  return moduleHasMethod ? moduleMethodHandler : responses.serveNotAllowed
}
