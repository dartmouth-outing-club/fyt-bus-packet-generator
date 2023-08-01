import test from 'node:test'
import assert from 'node:assert/strict'

import * as trips from '../src/routes/trips.js'
import * as sqlite from '../src/clients/sqlite.js'
import * as testUtils from './test-utils.js'

// Initialize the database
sqlite.start()
sqlite.execFile('./db/db-schema.sql')
sqlite.execFile('./test/test-trips.sql')

await test('POST /trips', async (t) => {
  await t.test('it posts a CSV', async () => {
    // Note that the web spec always includes carriage returns before newlines in metadata
    const body = `-----------------------------173775914214642084952696962115\r
Content-Disposition: form-data; name="trips-csv"; filename="trips.csv"\r
Content-Type: text/csv\r
\r
J4,8
J174,9

-----------------------------173775914214642084952696962115--`

    const { req, res } = testUtils.makeHttpObjects('/trips', body)
    req.headers = {
      'content-type': 'multipart/form-data; boundary=---------------------------173775914214642084952696962115'
    }
    await trips.post(req, res)
    assert.equal(res.statusCode, 302)
    assert.equal(sqlite.getAllTrips().length, 7)
  })
})

await test('DELETE /trips', async (t) => {
  await t.test('it does nothing if trip does not exist', async () => {
    const { req, res } = testUtils.makeHttpObjects('/trips/A10')
    await trips.del(req, res)
    assert.equal(res.statusCode, 200)
    assert.equal(sqlite.getAllTrips().length, 7)
  })

  await t.test('it deletes the provided trip', async () => {
    const { req, res } = testUtils.makeHttpObjects('/trips/A4')
    await trips.del(req, res)
    assert.equal(res.statusCode, 200)
    assert.equal(sqlite.getAllTrips().length, 6)
  })
})

// Close the database to reset it for the next test
sqlite.stop()
