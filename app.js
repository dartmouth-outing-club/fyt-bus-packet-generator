import fs from 'fs'
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
  console.log(`Request receieved for ${requestUrl}`)

  if (requestUrl.pathname === '/'){
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    res.statusCode = 200
    res.write(createFile(steps))
    res.end()
  } else if (requestUrl.pathname.startsWith('/static/')) {
    // TODO Protect against directory traversal
    const stream = fs.createReadStream('./' + requestUrl.pathname)
    res.statusCode = 200
    stream.pipe(res)
  } else {
    res.statusCode = 404
    res.end()
  }

})

server.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})
