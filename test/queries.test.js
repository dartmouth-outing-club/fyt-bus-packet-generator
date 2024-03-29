import test from 'node:test'
import assert from 'node:assert/strict'
import * as queries from '../src/queries.js'

test('parseQuery', async () => {
  await test('it parses a query with no additional stops', () => {
    const params = new URLSearchParams()
    params.append('route-name', 'Trip to Moosilauke')
    params.append('route-date', '2022-07-01')
    params.append('origin-location', 'Hanover')
    params.append('destination-location', 'Moosilauke')

    const expected = {
      name: 'Trip to Moosilauke',
      date: new Date('2022-07-01T08:00:00.000Z'),
      stopNames: ['Hanover', 'Moosilauke'],
      tripsOnboard: [],
      notes: null
    }
    assert.deepEqual(queries.parseQuery(params), expected)
  })

  await test('it parses a query with one stop', () => {
    const params = new URLSearchParams()
    params.append('route-name', 'Trip to Moosilauke')
    params.append('route-date', '2022-07-01')
    params.append('origin-location', 'Hanover')
    params.append('stop1-location', 'Dartmouth Skiway')
    params.append('destination-location', 'Moosilauke')

    const expected = {
      name: 'Trip to Moosilauke',
      date: new Date('2022-07-01T08:00:00.000Z'),
      stopNames: ['Hanover', 'Dartmouth Skiway', 'Moosilauke'],
      tripsOnboard: [],
      notes: null
    }
    assert.deepEqual(queries.parseQuery(params), expected)
  })

  await test('it parses a query with four steps, in the correct step order', () => {
    const params = new URLSearchParams()
    params.append('route-name', 'Trip to Moosilauke')
    params.append('route-date', '2022-07-01')
    params.append('origin-location', 'Hanover')
    params.append('stop1-location', 'Lyme')
    params.append('stop3-location', 'DOC Cabin')
    params.append('stop4-location', 'Warren')
    params.append('stop2-location', 'Dartmouth Skiway')
    params.append('destination-location', 'Moosilauke')

    const expected = {
      name: 'Trip to Moosilauke',
      date: new Date('2022-07-01T08:00:00.000Z'),
      stopNames: ['Hanover', 'Lyme', 'Dartmouth Skiway', 'DOC Cabin', 'Warren', 'Moosilauke'],
      tripsOnboard: [],
      notes: null
    }
    assert.deepEqual(queries.parseQuery(params), expected)
  })

  await test('it throws an error if missing an origin', () => {
    const params = new URLSearchParams()
    params.append('route-name', 'Trip to Moosilauke')
    params.append('route-date', '2022-07-01')
    params.append('destination-location', 'Moosilauke')
    assert.throws(() => queries.parseQuery(params))
  })

  await test('it throws an error if missing a destination', () => {
    const params = new URLSearchParams()
    params.append('route-name', 'Trip to Moosilauke')
    params.append('route-date', '2022-07-01')
    params.append('origin-location', 'Hanover')
    assert.throws(() => queries.parseQuery(params))
  })
})

test('makeEdgeList', async () => {
  await test('it returns empty if list is empty', () => {
    assert.deepEqual(queries.makeEdgeList([]), [])
  })

  await test('it returns empty if list has a single element', () => {
    assert.deepEqual(queries.makeEdgeList([1]), [])
  })

  await test('it returns a list of one couple when given a list of two', () => {
    assert.deepEqual(queries.makeEdgeList([1, 2]), [[1, 2]])
  })

  await test('it returns a list of three couples when given a list of four', () => {
    assert.deepEqual(queries.makeEdgeList([1, 2, 3, 4]), [[1, 2], [2, 3], [3, 4]])
  })
})
