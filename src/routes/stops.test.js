import test from 'node:test'
import assert from 'node:assert/strict'

import * as stops from './stops.js'
import * as sqlite from '../clients/sqlite.js'
import * as testUtils from '../../test/test-utils.js'

// Initialize the database
sqlite.start()
sqlite.execFile('./db/db-schema.sql')
sqlite.execFile('./db/create-stops.sql')

await test('GET /api/stops', async (t) => {

  await t.test('it server bad request when no format is provided', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/stops')
    await stops.get(req, res)
    assert.equal(res.statusCode, 400)
    assert(res.body.includes('<h1>400</h1>'))
  })

  await t.test('it serves the stops in options format', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/stops?format=options')
    await stops.get(req, res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body,
`<option>Moosilauke Ravine Lodge
<option>Second College Grant
<option>Sweetland Farm`)
  })

  await t.test('it serves the stops in table format', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/stops?format=table')
    await stops.get(req, res)
    assert.equal(res.statusCode, 200)
    const expected = `<table>
<tr><th>Stop Name<th>Packets Present
<tr><td>Moosilauke Ravine Lodge<td>0
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

