import * as sqlite from './sqlite.js'
import { config } from '../config.js'

const GOOGLE_DIRECTIONS_API =
  'https://maps.googleapis.com/maps/api/directions/json'

export async function getDirections (origin, destination) {
  console.log(`Cache miss for directions from ${origin} to ${destination}`)
  const params = new URLSearchParams({
    ...createDirectionsRequest([origin, destination]),
    key: config.GOOGLE_API_KEY
  })
  const request = `${GOOGLE_DIRECTIONS_API}?${params}`

  console.log('Fetching directions from Google')
  return fetch(request)
    .then((res) => res.text())
    .then((text) => {
      sqlite.saveDirections(origin, destination, text)
      return JSON.parse(text)
    })
}

/**
 * Format a list of coordinates into a request to the Google Maps API.
 *
 * The resulting directions will create a route for the coordinates in the order
 * that they are provided. The first one is the origin, then second one is the first stop,
 * and so on. Lists of less than two values are invalid.
 *
 * For more, see the Google Directions API documentation.
 * https://developers.google.com/maps/documentation/directions/get-directions#waypoints
 */
export function createDirectionsRequest (coordinateList) {
  if (coordinateList.length < 2) {
    console.error(`Insufficient number of coordinateList: ${coordinateList}`)
    throw new Error('InvalidArgumentsException')
  }

  const origin = coordinateList.at(0)
  const destination = coordinateList.at(-1)
  const stops = coordinateList.slice(1, -1)

  const parameters = { origin, destination }
  if (stops.length > 0) {
    parameters.waypoints = stops.join('|')
  }

  return parameters
}
