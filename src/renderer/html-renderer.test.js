import test from 'node:test'
import assert from 'node:assert/strict'
import * as html from './html-renderer.js'

const STEP_ONE = html.step('Go <em>left</em>', '2 miles')
const STEP_TWO = html.step('Turn <em>right</em>', '5 miles')
const STEP_MISSING_DIRECTION = html.step('Go <em>left</em>', undefined)

const LEG_TO_HANOVER = html.leg(null, null, 'Hanover', 'Moosilauke', [STEP_ONE, STEP_TWO], null)

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
    const expected = `<section>
<h2>From Hanover</h2>
<ol>
<li>Go <em>left</em> &mdash; 2 miles
<li>Turn <em>right</em> &mdash; 5 miles
<li>
  <h2>Arrived at Moosilauke</h2>
  <p>
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
