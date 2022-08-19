import test from 'node:test'
import assert from 'node:assert/strict'

import * as trips from './trips.js'
import * as sqlite from '../clients/sqlite.js'

function makeHttpObjects (url) {
  const req = {
    url,
    headers: { host: 'example.com' }
  }

  const res = {
    body: '',
    headers: {},
    isDone: false,
    setHeader: (name, content) => { res.headers[name] = content },
    write: (str) => { res.body = str },
    end: () => res.isDone = true
  }

  return { req, res }
}

test('/api/trips route', async () => {
  sqlite.execFile('./scripts/db-schema.sql')
  sqlite.execFile('./test-data/create-trips.sql')

  test('server bad request when no format is provided', async () => {
    const { req, res } = makeHttpObjects('/api/trips')
    await trips.get(req, res)
    assert.equal(res.statusCode, 400)
    assert(res.body.includes('<h1>400</h1>'))
  })

  test('serves the trips in table format', async () => {
    const { req, res } = makeHttpObjects('/api/trips?format=options')
    await trips.get(req, res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body,
`<option>A4</option>
<option>A7</option>
<option>A35</option>
<option>A174</option>
<option>B6</option>`)
  })

})


