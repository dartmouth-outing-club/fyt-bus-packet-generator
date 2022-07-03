import test from 'node:test'
import assert from 'node:assert/strict'
import * as queries from './queries.js'

test('parseQuery', () => {
  test('it parses a query with no additional stops', () => {
    const params = new URLSearchParams()
    params.append('trip-name', 'Trip to Moosilauke')
    params.append('trip-date', '2022-07-01')
    params.append('origin-location', 'Hanover')
    params.append('destination-location', 'Moosilauke')

    const expected = {
      tripName: 'Trip to Moosilauke',
      date: '2022-07-01',
      stopNames: ['Hanover', 'Moosilauke']
    }
    assert.deepEqual(queries.parseQuery(params), expected)
  })

  test('it parses a query with one stop', () => {
    const params = new URLSearchParams()
    params.append('trip-name', 'Trip to Moosilauke')
    params.append('trip-date', '2022-07-01')
    params.append('origin-location', 'Hanover')
    params.append('stop1-location', 'Dartmouth Skiway')
    params.append('destination-location', 'Moosilauke')

    const expected = {
      tripName: 'Trip to Moosilauke',
      date: '2022-07-01',
      stopNames: ['Hanover', 'Dartmouth Skiway', 'Moosilauke']
    }
    assert.deepEqual(queries.parseQuery(params), expected)
  })

  test('it parses a query with four steps, in the correct step order', () => {
    const params = new URLSearchParams()
    params.append('trip-name', 'Trip to Moosilauke')
    params.append('trip-date', '2022-07-01')
    params.append('origin-location', 'Hanover')
    params.append('stop1-location', 'Lyme')
    params.append('stop3-location', 'DOC Cabin')
    params.append('stop4-location', 'Warren')
    params.append('stop2-location', 'Dartmouth Skiway')
    params.append('destination-location', 'Moosilauke')

    const expected = {
      tripName: 'Trip to Moosilauke',
      date: '2022-07-01',
      stopNames: ['Hanover', 'Lyme', 'Dartmouth Skiway', 'DOC Cabin', 'Warren', 'Moosilauke']
    }
    assert.deepEqual(queries.parseQuery(params), expected)
  })

  test('it throws an error if missing an origin', () => {
    const params = new URLSearchParams()
    params.append('trip-name', 'Trip to Moosilauke')
    params.append('trip-date', '2022-07-01')
    params.append('destination-location', 'Moosilauke')
    assert.throws(() => queries.parseQuery(params))
  })

  test('it throws an error if missing a destination', () => {
    const params = new URLSearchParams()
    params.append('trip-name', 'Trip to Moosilauke')
    params.append('trip-date', '2022-07-01')
    params.append('origin-location', 'Hanover')
    assert.throws(() => queries.parseQuery(params))
  })
})

test('makeEdgeList', () => {
  test('it returns empty if list is empty', () => {
    assert.deepEqual(queries.makeEdgeList([]), [])
  })

  test('it returns empty if list has a single element', () => {
    assert.deepEqual(queries.makeEdgeList([1]), [])
  })

  test('it returns a list of one couple when given a list of two', () => {
    assert.deepEqual(queries.makeEdgeList([1, 2]), [[1, 2]])
  })

  test('it returns a list of three couples when given a list of four', () => {
    assert.deepEqual(queries.makeEdgeList([1, 2, 3, 4]), [[1, 2], [2, 3], [3, 4]])
  })
})
