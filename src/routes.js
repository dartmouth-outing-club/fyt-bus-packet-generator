import * as packets from './routes/packets.js'
import * as responses from './responses.js'
import * as stops from './routes/stops.js'
import * as trips from './routes/trips.js'

function handle (module, req, res) {
  switch (req.method) {
    case 'POST':
      if (typeof module.post !== 'function') return responses.serveNotAllowed(res)
      return module.post(req, res)
    case 'GET':
      if (typeof module.get !== 'function') return responses.serveNotAllowed(res)
      return module.get(req, res)
    case 'DELETE':
      if (typeof module.del !== 'function') return responses.serveNotAllowed(res)
      return module.del(req, res)
    default:
      return responses.methodNotAllowed(res)
  }
}

export const handlePacketsRoute = (req, res) => handle(packets, req, res)
export const handleStopsRoute = (req, res) => handle(stops, req, res)
export const handleTripsRoutes = (req, res) => handle(trips, req, res)
