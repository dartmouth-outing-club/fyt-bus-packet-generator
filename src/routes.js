import * as packets from './routes/packets.js'
import * as stops from './routes/stops.js'
import * as trips from './routes/trips.js'
import * as regenerate from './routes/regenerate.js'
import * as directions from './routes/directions.js'
import * as responses from './responses.js'

export function getHandler (url, httpMethod, serveStatic = false) {
  const subRoutes = url.pathname.split('/')
  // If the route doesn't start with /api, it's a static route
  if (subRoutes.at(1) !== 'api') {
    if (httpMethod !== 'GET') {
      return responses.serveBadRequest
    } else if (serveStatic) {
      return (req, res) => responses.serveStaticFile(req, res, url.pathname)
    }

    console.error(STATIC_FILE_WARNING)
    return responses.serveNotFound
  }

  // If it starts with /api, send it to the appropriate API handler
  // Note that getModuleMethodHandler returns a function that can be called later
  switch (subRoutes.at(2)) {
    case 'stops':
      return getModuleMethodHandler(stops, httpMethod)
    case 'packets':
      return getModuleMethodHandler(packets, httpMethod)
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

const STATIC_FILE_WARNING = `Error - your server is not configured correctly.
All requests to this server should be prefixed with /api/, but this one was not.
Check your nginx configuration and ensure that only /api/ requests get sent here.`
