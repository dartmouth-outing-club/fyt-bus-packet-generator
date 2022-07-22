import test from 'node:test'
import assert from 'node:assert/strict'
import * as html from './html-renderer.js'

const STEP_ONE = html.step('Go <em>left</em>', '2 miles')
const STEP_TWO = html.step('Turn <em>right</em>', '5 miles')
const STEP_MISSING_DIRECTION = html.step('Go <em>left</em>', undefined)
const TRIP_J174 = [ { name: 'J174', num_students: 10 } ]

const LEG_TO_HANOVER = html.leg( { text: '20 min' }, { text: '5 mi' }, 'Hanover', 'Moosilauke',
  [STEP_ONE, STEP_TWO], null, TRIP_J174, [])

test('html.step', () => {
  test('it concatenates the step with the distance', () => {
    const expected = '<li>Go <em>left</em> &mdash; 2 miles'
    assert.equal(STEP_ONE.toString(), expected)
  })

  test('it makes step with a "missing distance" message when distance not provided', () => {
    const expected = '<li>Go <em>left</em> &mdash; (Missing distance)'
    assert.equal(STEP_MISSING_DIRECTION.toString(), expected)
  })
})

test('html.leg', () => {
  test('it adds the steps after the start address', () => {
    console.log(LEG_TO_HANOVER.toString())
    const expected = `<section>
<ol>
<li>
<h2>From Hanover</h2>
<p><b>5 mi</b> to next destination (<b>20 min</b>)
<h3>Trips on</h3>
<ul>
<li><b>J174</b> (10 people)
</ul>

<li>Go <em>left</em> &mdash; 2 miles
<li>Turn <em>right</em> &mdash; 5 miles
<li>
<h2>Arrived at Moosilauke</h2>
<p>
<h3>Trips off</h3>

</ol>
</section>
`
    assert.equal(LEG_TO_HANOVER.toString(), expected)
  })

  test('it throws an exception when the leg is missing steps', () => {
    const startAddress = 'Hanover, NH 03755, USA'
    assert.throws(() => html.leg(startAddress, undefined))
  })
})

test('stopsOptionList', () => {
  const stops = ['Hanover', 'Moosilauke Ravine Lodge', 'The Grant']
  const expected = `<option>Hanover
<option>Moosilauke Ravine Lodge
<option>The Grant`
  const options = html.stopsOptionList(stops)
  assert.equal(options.toString(), expected)
})
