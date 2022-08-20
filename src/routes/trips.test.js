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

// Initialize the database
sqlite.start()
sqlite.execFile('./db/db-schema.sql')
sqlite.execFile('./db/create-trips.sql')

await test('GET /api/trips', async (t) => {

  await t.test('it server bad request when no format is provided', async () => {
    const { req, res } = makeHttpObjects('/api/trips')
    await trips.get(req, res)
    assert.equal(res.statusCode, 400)
    assert(res.body.includes('<h1>400</h1>'))
  })

  await t.test('it serves the trips in options format', async () => {
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

  await t.test('it serves the trips in table format', async () => {
    const { req, res } = makeHttpObjects('/api/trips?format=table')
    await trips.get(req, res)
    assert.equal(res.statusCode, 200)
    const expected = `<table>
<tr>
<th>Trip Name
<th>Num Students
<th>Num Packets
<th>Packets Present

<tr>
<td>A4
<td>9
<td>0
<td>(none)

<tr>
<td>A7
<td>9
<td>0
<td>(none)

<tr>
<td>A35
<td>8
<td>0
<td>(none)

<tr>
<td>A174
<td>10
<td>0
<td>(none)

<tr>
<td>B6
<td>7
<td>0
<td>(none)

</table>
`
    assert.equal(res.body, expected)
  })
})

await test('DELETE /api/trips', async (t) => {
  await t.test('it deletes the provided trip', async () => {
    const { req, res } = makeHttpObjects('/api/trips/A4')
    await trips.del(req, res)
    assert.equal(res.statusCode, 204)
    assert.equal(sqlite.getAllTrips().length, 4)
  })
})

// Close the database to reset it for the next test
sqlite.stop()
