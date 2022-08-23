import test from 'node:test'
import assert from 'node:assert/strict'
import * as html from './html-renderer.js'

const STEP_ONE = html.step('Go <em>left</em>', '2 miles')
const STEP_TWO = html.step('Turn <em>right</em>', '5 miles')
const STEP_MISSING_DIRECTION = html.step('Go <em>left</em>', undefined)
const TRIP_J174 = [{ name: 'J174', num_students: 10 }]

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

test('stopsOptionList', () => {
  const stops = [{ name: 'Hanover' }, { name: 'Moosilauke Ravine Lodge' }, { name: 'The Grant' }]
  const expected = `<option>Hanover
<option>Moosilauke Ravine Lodge
<option>The Grant`
  const options = html.stopsOptionList(stops)
  assert.equal(options.toString(), expected)
})
