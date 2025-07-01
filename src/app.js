import http from 'node:http'

import * as config from './config.js'
import * as responses from './responses.js'
import * as routes from './routes.js'
import * as sqlite from './clients/sqlite.js'

const port = 4000
const host = '0.0.0.0'

if (process.env.NODE_ENV === 'development') config.loadEnv()

const databaseUrl = process.env.NODE_ENV === 'development' ? './packet-generator.db' : process.env.DB_FILEPATH

// Start the db and set the connection to close when it exists
sqlite.start(databaseUrl)
process.on('exit', () => sqlite.stop())
process.on('SIGHUP', () => process.exit(128 + 1))
process.on('SIGINT', () => process.exit(128 + 2))
process.on('SIGTERM', () => process.exit(128 + 15))

const app = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  console.log(`${req.method} request receieved for ${requestUrl}`)
  try {
    // Get the function that will handle the request, then call it with (req, res)
    const handler = routes.getHandler(requestUrl, req.method)
    await handler(req, res)
  } catch (error) {
    console.error('ERROR - uncaught exception while handling request\n', error)
    responses.serveServerError(req, res)
  }
})

app.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})
