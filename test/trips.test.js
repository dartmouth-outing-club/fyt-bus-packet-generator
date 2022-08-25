import test from 'node:test'
import assert from 'node:assert/strict'

import * as trips from '../src/routes/trips.js'
import * as sqlite from '../src/clients/sqlite.js'
import * as testUtils from './test-utils.js'


// Initialize the database
sqlite.start()
sqlite.execFile('./db/db-schema.sql')
sqlite.execFile('./test/test-trips.sql')

await test('GET /api/trips', async (t) => {
  await t.test('it server bad request when no format is provided', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/trips')
    await trips.get(req, res)
    assert.equal(res.statusCode, 400)
    assert(res.body.includes('<h1>400</h1>'))
  })

  await t.test('it server bad request when unknown format is provided', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/trips?list')
    await trips.get(req, res)
    assert.equal(res.statusCode, 400)
    assert(res.body.includes('<h1>400</h1>'))
  })

  await t.test('it serves the trips in options format', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/trips?format=options')
    await trips.get(req, res)
    const expected =
`<option>A4</option>
<option>A7</option>
<option>A35</option>
<option>A174</option>
<option>B6</option>`

    assert.equal(res.statusCode, 200)
    assert.equal(res.body, expected)
  })

  await t.test('it serves the trips in table format', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/trips?format=table')
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
    assert.equal(res.statusCode, 200)
    assert.equal(res.body, expected)
  })
})

await test('POST /api/trips', async (t) => {
  await t.test('it posts a CSV', async () => {
    // Note that the web spec always includes carriage returns before newlines in metadata
    const body = `-----------------------------173775914214642084952696962115\r
Content-Disposition: form-data; name="trips-csv"; filename="trips.csv"\r
Content-Type: text/csv\r
\r
J4,8
J174,9

-----------------------------173775914214642084952696962115--`

    const { req, res } = testUtils.makeHttpObjects('/api/trips', body)
    req.headers = {
      'content-type': 'multipart/form-data; boundary=---------------------------173775914214642084952696962115'
    }
    await trips.post(req, res)
    assert.equal(res.statusCode, 302)
    assert.equal(sqlite.getAllTrips().length, 7)
  })
})

await test('DELETE /api/trips', async (t) => {
  await t.test('it does nothing if trip does not exist', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/trips/A10')
    await trips.del(req, res)
    assert.equal(res.statusCode, 204)
    assert.equal(sqlite.getAllTrips().length, 7)
  })

  await t.test('it deletes the provided trip', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/trips/A4')
    await trips.del(req, res)
    assert.equal(res.statusCode, 204)
    assert.equal(sqlite.getAllTrips().length, 6)
  })
})

// Close the database to reset it for the next test
sqlite.stop()
