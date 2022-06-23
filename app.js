import http from 'http'
import { loadFile } from './server/utils.js'
import { createFile, createLeg } from './server/html-elements.js'
import { getLegsFromResponse } from './server/directions-api.js'

const port = process.env.PORT || 3000
const host = 'localhost'

// Temporary - load sample response
const API_RESPONSE_FILE = './samples/sample-directions-api-response.json'
const response = JSON.parse(await loadFile(API_RESPONSE_FILE))
const steps = getLegsFromResponse(response).flatMap(createLeg).join('\n')

const server = http.createServer(async (req, res) => {

  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const routes = requestUrl.pathname.split('/')
  console.log(`Request receieved for ${requestUrl}`)

  // TODO Protect against directory traversal
  if (routes.at(1) === 'static') {
    const file = await loadFile('./' + requestUrl.pathname)
    res.statusCode = 200
    res.write(file)
  } else if (requestUrl.pathname === '/'){
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    res.statusCode = 200
    res.write(createFile(steps))
  } else {
    res.statusCode = 404
  }

  res.end()
})

server.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})
