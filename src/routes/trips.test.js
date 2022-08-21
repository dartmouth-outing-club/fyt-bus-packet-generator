import test from 'node:test'
import assert from 'node:assert/strict'
// import stream from 'node:stream'

import * as trips from './trips.js'
import * as sqlite from '../clients/sqlite.js'
import * as testUtils from '../../test/test-utils.js'

// Initialize the database
sqlite.start()
sqlite.execFile('./db/db-schema.sql')
sqlite.execFile('./db/create-trips.sql')

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

// await test('POST /api/trips', async (t) => {
//   await t.test('it posts a CSV', async () => {
//     const body = `-----------------------------173775914214642084952696962115
// Content-Disposition: form-data; name="trips-csv"; filename="trips.csv"
// Content-Type: text/csv

// J4,8
// J174,9

// -----------------------------173775914214642084952696962115--`
//     const { req, res } = makeHttpObjects('/api/trips')
//     req.headers = {
//       'content-type': 'multipart/form-data; boundary=---------------------------173775914214642084952696962115'
//     }
//     req.body = stream.Readable.from(body)
//     await trips.post(req, res)
//     Buffer.from()
//     assert.equal(res.statusCode, 200)
//     assert.equal(sqlite.getAllTrips().length, 6)
//   })
// })

await test('DELETE /api/trips', async (t) => {
  await t.test('it does nothing if trip does not exist', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/trips/A10')
    await trips.del(req, res)
    assert.equal(res.statusCode, 204)
    assert.equal(sqlite.getAllTrips().length, 5)
  })

  await t.test('it deletes the provided trip', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/trips/A4')
    await trips.del(req, res)
    assert.equal(res.statusCode, 204)
    assert.equal(sqlite.getAllTrips().length, 4)
  })
})

// Close the database to reset it for the next test
sqlite.stop()
