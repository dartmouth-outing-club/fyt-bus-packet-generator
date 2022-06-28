import test from 'node:test'
import assert from 'node:assert/strict'
import { Step, Leg } from './html-elements.js'

const STEP_ONE = new Step('Go <em>left</em>', '2 miles')
const STEP_TWO = new Step('Turn <em>right</em>', '5 miles')
const STEP_MISSING_DIRECTION = new Step('Go <em>left</em>', undefined)

const LEG_TO_HANOVER = new Leg('Hanover, NH 03755, USA', [STEP_ONE, STEP_TWO])

test('new Step', () => {
  test('it concatenates the step with the distance', () => {
    const expected = '<li>Go <em>left</em> &mdash; 2 miles</li>'
    assert.equal(STEP_ONE.toString(), expected)
  })

  test('it makes step with a "missing distance" message when distance not provided', () => {
    const expected = '<li>Go <em>left</em> &mdash; (Missing distance)</li>'
    assert.equal(STEP_MISSING_DIRECTION.toString(), expected)
  })
})

test('new Leg', () => {
  test('it adds the steps after the start address', () => {
    const expected = `<section>
<h2>From Hanover, NH 03755</h2>
<ol>
<li>Go <em>left</em> &mdash; 2 miles</li>
<li>Turn <em>right</em> &mdash; 5 miles</li>
</ol>
</section>
`
    assert.equal(LEG_TO_HANOVER.toString(), expected)
  })

  test('it throws an exception when the leg is missing steps', () => {
    const startAddress = 'Hanover, NH 03755, USA'
    assert.throws(() => new Leg(startAddress, undefined))
  })
})
