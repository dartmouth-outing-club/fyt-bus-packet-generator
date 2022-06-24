import fs from 'fs'
import path from 'path'
import http from 'http'
import { loadFile } from './server/utils.js'
import { createFile, createLeg } from './server/html-elements.js'
import { getLegsFromResponse } from './server/directions-api.js'

const port = process.env.PORT || 3000
const host = 'localhost'

// Temporary - load sample response
const API_RESPONSE_FILE = './samples/grant-to-lodge-to-hanvoer.json'
const response = JSON.parse(await loadFile(API_RESPONSE_FILE))
const steps = getLegsFromResponse(response).flatMap(createLeg).join('\n')

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  console.log(`Request receieved for ${requestUrl}`)

  if (requestUrl.pathname === '/') {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    res.statusCode = 200
    res.write(createFile(steps, 'Trip to Hanover'))
    res.end()
  } else if (requestUrl.pathname.startsWith('/static/')) {
    // This pathname is protected from directory traversal based on how URL parses pathnames
    // See https://url.spec.whatwg.org/#path-state
    const filepath = path.join(path.resolve(), '/', requestUrl.pathname)
    const stream = fs.createReadStream(filepath)
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
