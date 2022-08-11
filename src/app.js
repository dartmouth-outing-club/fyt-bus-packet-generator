import http from 'node:http'

import * as responses from './responses.js'
import * as routes from './routes.js'

const env = process.env.NODE_ENV
const port = process.env.PORT || 3000
const host = 'localhost'

const app = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  console.log(`${req.method} request receieved for ${requestUrl}`)
  try {
    // Get the function that will handle the request, then call it with (req, res)
    const handler = routes.getHandler(requestUrl, req.method, env === 'development')
    await handler(req, res)
  } catch (error) {
    console.error('ERROR - uncaught exception while handling request\n', error)
    responses.serveServerError(req, res)
  }
})

app.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})
