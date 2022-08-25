import test from 'node:test'
import assert from 'node:assert/strict'

import * as directions from '../src/routes/directions.js'
import * as sqlite from '../src/clients/sqlite.js'
import * as testUtils from './test-utils.js'

await test('GET /api/directions', async (t) => {
  // Initialize the database
  sqlite.start()
  sqlite.execFile('./db/db-schema.sql')

  await t.test('it returns an empty list when there are no directions yet', async () => {
    const { req, res } = testUtils.makeHttpObjects('/api/directions')
    await directions.get(req, res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body, '')
  })

  await t.test('it serves the directions when cached directions are present', async () => {
    sqlite.execFile('./test/test-stops.sql')
    sqlite.execFile('./test/test-directions.sql')
    const { req, res } = testUtils.makeHttpObjects('/api/directions')
    await directions.get(req, res)
    const expected = `
<li onclick="this.classList.toggle('expanded')">
<button>Robinson Hall to Moosilauke Ravine Lodge</button>
<ol>
<li>Head <b>east</b> on <b>Sanborn Ln</b> toward <b>N Main St</b> &mdash; 112 ft
<li>Turn <b>right</b> onto <b>N Main St</b> &mdash; 308 ft
<li>Turn <b>right</b> onto <b>W Wheelock St</b><div style="font-size:0.9em">Entering Vermont</div> &mdash; 0.8 mi
<li>Continue onto <b>VT-10A W</b> &mdash; 217 ft
<li>Turn <b>right</b> to merge onto <b>I-91 N</b> toward <b>Thetford</b>/<wbr/><b>St Johnsbury</b> &mdash; 16.5 mi
<li>Take exit <b>15</b> toward <b>US-5</b>/<wbr/><b>Fairlee</b>/<wbr/><b>Orford NH</b> &mdash; 0.2 mi
<li>Turn <b>right</b> onto <b>Lake Morey Rd</b> &mdash; 0.1 mi
<li>Turn <b>left</b> onto <b>US-5 N</b> &mdash; 0.5 mi
<li>Turn <b>right</b> onto <b>VT-25A E</b><div style="font-size:0.9em">Entering New Hampshire</div> &mdash; 371 ft
<li>Continue onto <b>NH-25A E</b> &mdash; 0.2 mi
<li>Turn <b>right</b> onto <b>NH-10 S</b>/<wbr/><b>NH-25A E</b> &mdash; 0.3 mi
<li>Turn <b>left</b> onto <b>NH-25A E</b> &mdash; 14.5 mi
<li>Turn <b>left</b> onto <b>NH-118 N</b>/<wbr/><b>NH-25 W</b> &mdash; 4.7 mi
<li>Turn <b>right</b> onto <b>NH-118 N</b><div style="font-size:0.9em">Destination will be on the left</div> &mdash; 5.9 mi
</ol>
`
    assert.equal(res.statusCode, 200)
    assert.equal(res.body, expected)
  })
})

// Close the database to reset it for the next test
sqlite.stop()
