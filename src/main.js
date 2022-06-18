import http from 'http'
import fs from 'fs/promises'

const port = process.env.PORT || 3000
const host = 'localhost'

const API_RESPONSE_FILE = './samples/sample-directions-api-response.json'
const RESPONSE_JSON = await fs.readFile(API_RESPONSE_FILE, { encoding: 'utf8' }).then(file => file.toString())

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  console.log(`Request receieved for ${requestUrl}`)

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.write(RESPONSE_JSON)
  res.end()
})

server.listen(port, host, () => {
  console.log(`It's giving... http://${host}:${port}`)
})
