import test from 'node:test'
import assert from 'node:assert/strict'

import { createDirectionsRequest } from '../../src/clients/google-client.js'

const HANOVER_COORDINATES = '44.875039,-71.05471'
const LODJ_COORDINATES = '43.977253,-71.8154831'
const ANDROSCOGGIN_COORDINATES = '44.714042,-71.173832'
const GRANT_COORDINATES = '44.875039,-71.05471'

test('test createDirectionsRequest', async () => {
  await test('it rejects an array of length 1', () => {
    assert.throws(() => createDirectionsRequest(['test']))
  })

  await test('it creates a directions request with no waypoint', () => {
    const coordinatesArray = [HANOVER_COORDINATES, GRANT_COORDINATES]
    const parameters = createDirectionsRequest(coordinatesArray)
    assert.equal(parameters.origin, HANOVER_COORDINATES)
    assert.equal(parameters.destination, GRANT_COORDINATES)
  })

  await test('it creates a directions request with a single intervening waypoint', () => {
    const coordinatesArray = [
      HANOVER_COORDINATES,
      LODJ_COORDINATES,
      GRANT_COORDINATES
    ]
    const parameters = createDirectionsRequest(coordinatesArray)

    assert.equal(parameters.origin, HANOVER_COORDINATES)
    assert.equal(parameters.destination, GRANT_COORDINATES)
    assert.equal(parameters.waypoints, LODJ_COORDINATES)
  })

  await test('it creates a directions request with many intervening waypoints', () => {
    const coordinatesArray = [
      HANOVER_COORDINATES,
      LODJ_COORDINATES,
      ANDROSCOGGIN_COORDINATES,
      GRANT_COORDINATES
    ]
    const parameters = createDirectionsRequest(coordinatesArray)

    assert.equal(parameters.origin, HANOVER_COORDINATES)
    assert.equal(parameters.destination, GRANT_COORDINATES)
    assert.equal(
      parameters.waypoints,
      `${LODJ_COORDINATES}|${ANDROSCOGGIN_COORDINATES}`
    )
  })
})
