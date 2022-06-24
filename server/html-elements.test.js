import test from 'node:test'
import assert from 'node:assert/strict'
import { createStep, createPageTitle, createLeg } from './html-elements.js'

test('createTitle', () => {
  test('it inserts the title inside <h1> tags', () => {
    const title = 'Hanover, NH Bus Route'
    const titleElement = createPageTitle(title)

    const expected = '<h1>Hanover, NH Bus Route</h1>'
    assert.equal(titleElement, expected)
  })
})

test('createStep', () => {
  test('it concatenates the step with the distance', () => {
    const step = { instructionsHtml: 'Go <em>left</em>', distanceText: '2 miles' }
    const expected = '<p>Go <em>left</em> - 2 miles</p>'
    assert.equal(createStep(step), expected)
  })

  test('it makes step with a "missing distance" message when distance not provided', () => {
    const step = { instructionsHtml: 'Go <em>left</em>' }
    const expected = '<p>Go <em>left</em> - (Missing distance)</p>'
    assert.equal(createStep(step), expected)
  })
})

test('createLeg', () => {
  test('it creates a header with the start address', () => {
    const leg = { startAddress: 'Hanover, NH', steps: [] }
    assert.equal(createLeg(leg), '<h2>Hanover, NH</h2>\n')
  })

  test('it adds the steps after the start address', () => {
    const step = { instructionsHtml: 'Go <em>left</em>', distanceText: '2 miles' }
    const leg = { startAddress: 'Hanover, NH', steps: [step] }
    const expected = '<h2>Hanover, NH</h2>\n<p>Go <em>left</em> - 2 miles</p>'
    assert.equal(createLeg(leg), expected)
  })

  test('it throws an exception when the leg is missing steps', () => {
    const leg = { startAddress: 'Hanover, NH' }
    assert.throws(() => createLeg(leg))
  })
})
