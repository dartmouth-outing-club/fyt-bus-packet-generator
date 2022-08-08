import * as packets from './routes/packets.js'
import * as stops from './routes/stops.js'
import * as trips from './routes/trips.js'
import * as regenerate from './routes/regenerate.js'
import * as directions from './routes/directions.js'
import * as responses from './responses.js'

const isFunction = (x) => (typeof x === 'function')
const serveNotAllowed = (res, method) => {
  console.warn(`Invalid request received for ${method} method`)
  return responses.serveNotAllowed(res)
}

function handle (module, req, res) {
  switch (req.method) {
    case 'POST':
      return isFunction(module.post) ? module.post(req, res) : serveNotAllowed(res, req.method)
    case 'GET':
      return isFunction(module.get) ? module.get(req, res) : serveNotAllowed(res, req.method)
    case 'DELETE':
      return isFunction(module.del) ? module.del(req, res) : serveNotAllowed(res, req.method)
    default:
      return responses.methodNotAllowed(res)
  }
}

export const handlePacketsRoute = (req, res) => handle(packets, req, res)
export const handleStopsRoute = (req, res) => handle(stops, req, res)
export const handleTripsRoute = (req, res) => handle(trips, req, res)
export const handleRegenerateRoute = (req, res) => handle(regenerate, req, res)
export const handleDirectionsRoute = (req, res) => handle(directions, req, res)
