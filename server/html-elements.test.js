import test from 'node:test'
import assert from 'node:assert/strict'
import { createStep, createLeg } from './html-elements.js'

test('createStep', () => {
  test('it concatenates the step with the distance', () => {
    const step = { instructionsHtml: 'Go <em>left</em>', distanceText: '2 miles' }
    const expected = '<p>Go <em>left</em> - 2 miles</p>\n'
    assert.equal(createStep(step), expected)
  })

  test('it makes step with a "missing distance" message when distance not provided', () => {
    const step = { instructionsHtml: 'Go <em>left</em>' }
    const expected = '<p>Go <em>left</em> - (Missing distance)</p>\n'
    assert.equal(createStep(step), expected)
  })
})

test('createLeg', () => {
  test('it creates a header with the start address', () => {
    const leg = { startAddress: 'Hanover, NH', steps: [] }
    assert.equal(createLeg(leg), '<section>\n<h2>Hanover, NH</h2>\n</section>')
  })

  test('it adds the steps after the start address', () => {
    const stepOne = { instructionsHtml: 'Go <em>left</em>', distanceText: '2 miles' }
    const stepTwo = { instructionsHtml: 'Turn <em>right</em>', distanceText: '5 miles' }
    const leg = { startAddress: 'Hanover, NH', steps: [stepOne, stepTwo] }
    const expected = '<section>\n<h2>Hanover, NH</h2>\n<p>Go <em>left</em> - 2 miles</p>\n<p>Turn <em>right</em> - 5 miles</p>\n</section>'
    assert.equal(createLeg(leg), expected)
  })

  test('it throws an exception when the leg is missing steps', () => {
    const leg = { startAddress: 'Hanover, NH' }
    assert.throws(() => createLeg(leg))
  })
})
