import test from 'node:test'
import assert from 'node:assert/strict'

import * as stops from '../src/routes/stops.js'
import * as sqlite from '../src/clients/sqlite.js'
import * as testUtils from './test-utils.js'

// Initialize the database
sqlite.start()
sqlite.execFile('./db/db-schema.sql')
sqlite.execFile('./test/test-stops.sql')

await test('GET /stops', async (t) => {
  await t.test('it serves the stops in options format', async () => {
    const { req, res } = testUtils.makeHttpObjects('/stops?format=options')
    await stops.get(req, res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body,
`<option>Moosilauke Ravine Lodge
<option>Robinson Hall
<option>Second College Grant
<option>Sweetland Farm`)
  })

  await t.test('it serves the stops in table format', async () => {
    const { req, res } = testUtils.makeHttpObjects('/stops?format=table')
    await stops.get(req, res)
    assert.equal(res.statusCode, 200)
    const expected = `<table>
<tr><th>Stop Name<th>Packets Present
<tr><td>Moosilauke Ravine Lodge<td>0
<tr><td>Robinson Hall<td>0
<tr><td>Second College Grant<td>0
<tr><td>Sweetland Farm<td>0
</table>
`
    assert.equal(res.statusCode, 200)
    assert.equal(res.body, expected)
  })
})

// Close the database to reset it for the next test
sqlite.stop()
