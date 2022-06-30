import http from 'node:http'
import * as server from './server.js'

const port = process.env.PORT || 3000
const host = 'localhost'


const app = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  console.log(`${req.method} request receieved for ${requestUrl}`)
  const topRoute = requestUrl.pathname.split('/')[1]

  switch (topRoute) {
    case '':
      server.handleRoot(req, res)
      break
    case 'static':
      server.handleStaticRoute(req, res)
      break
    case 'stops':
      server.handleStopsRoute(req, res)
      break
    case 'packet':
      server.handlePacketRoute(req, res)
      break
    default:
      server.serveNotFound(res)
  }
})

app.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})
