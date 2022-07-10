import http from 'node:http'

import * as responses from './responses.js'
import * as routes from './routes.js'

const env = process.env.NODE_ENV
const port = process.env.PORT || 3000
const host = 'localhost'

const STATIC_FILE_WARNING = `Error - your server is not configured correctly.
All requests to this server should be prefixed with /api/, but this one was not.
Check your nginx configuration and ensure that only /api/ requests get sent here.`

const app = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  console.log(`${req.method} request receieved for ${requestUrl}`)
  const subRoutes = requestUrl.pathname.split('/')

  // If the route doesn't start with /api, it's a static route
  if (subRoutes[1] !== 'api') {
    if (env !== 'development') {
      console.error(STATIC_FILE_WARNING)
      return responses.serveNotFound(res)
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host}`)
    return responses.serveStaticFile(res, requestUrl.pathname)
  }

  // If it start with /api, send it to the appropriate API handler
  switch (subRoutes[2]) {
    case 'stops':
      routes.handleStopsRoute(req, res)
      break
    case 'packet':
      routes.handlePacketRoute(req, res)
      break
    default:
      responses.serveNotFound(res)
  }
})

app.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})

// TODO Add "on crash" listener
