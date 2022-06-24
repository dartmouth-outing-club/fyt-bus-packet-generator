import test from 'node:test'
import assert from 'node:assert/strict'
import { createStep, createLeg } from './html-elements.js'

test('createStep', () => {
  test('it concatenates the step with the distance', () => {
    const step = { instructionsHtml: 'Go <em>left</em>', distanceText: '2 miles' }
    const expected = '<li>Go <em>left</em> &mdash; 2 miles</li>\n'
    assert.equal(createStep(step), expected)
  })

  test('it makes step with a "missing distance" message when distance not provided', () => {
    const step = { instructionsHtml: 'Go <em>left</em>' }
    const expected = '<li>Go <em>left</em> &mdash; (Missing distance)</li>\n'
    assert.equal(createStep(step), expected)
  })
})

test('createLeg', () => {
  test('it creates a header with the start address', () => {
    const leg = { startAddress: 'Hanover, NH 03755, USA', steps: [] }
    const expected = `<section>
<h2>From Hanover, NH 03755</h2>
<ol>
</ol>
</section>
`
    assert.equal(createLeg(leg), expected)
  })

  test('it adds the steps after the start address', () => {
    const stepOne = { instructionsHtml: 'Go <em>left</em>', distanceText: '2 miles' }
    const stepTwo = { instructionsHtml: 'Turn <em>right</em>', distanceText: '5 miles' }
    const leg = { startAddress: 'Hanover, NH 03755, USA', steps: [stepOne, stepTwo] }
    const expected = `<section>
<h2>From Hanover, NH 03755</h2>
<ol>
<li>Go <em>left</em> &mdash; 2 miles</li>
<li>Turn <em>right</em> &mdash; 5 miles</li>
</ol>
</section>
`
    assert.equal(createLeg(leg), expected)
  })

  test('it throws an exception when the leg is missing steps', () => {
    const leg = { startAddress: 'Hanover, NH' }
    assert.throws(() => createLeg(leg))
  })
})
