import * as sqlite from './sqlite.js'

const GOOGLE_DIRECTIONS_API =
  'https://maps.googleapis.com/maps/api/directions/json'
const BACKOFF_DELAY = 1000

/** Wait an exponentially increasing time before retrying the API again. */
function delay (attempts) {
  const ms = BACKOFF_DELAY * (2 ^ attempts)
  return new Promise((resolve) => setTimeout(() => resolve(), ms))
}

export async function getDirections (origin, destination, attempts = 0) {
  console.log(`Cache miss for directions from ${origin} to ${destination}`)
  const params = new URLSearchParams({
    ...createDirectionsRequest([origin, destination]),
    key: process.env.GOOGLE_API_KEY
  })
  const request = `${GOOGLE_DIRECTIONS_API}?${params}`

  console.log('Fetching directions from Google')
  const res = await fetch(request)
  const text = await res.text()
  const apiResponse = JSON.parse(text)

  // If successful, save the directions and return them
  if (apiResponse.status === 'OK') {
    sqlite.saveDirections(origin, destination, text)
    return JSON.parse(text)
  }

  // If we hit the query limit, attempt it again after a delay
  if (apiResponse.status === 'OVER_QUERY_LIMIT' && attempts < 3) {
    console.log(`Hit query limit for attempt ${attempts + 1}`)
    await delay(attempts)
    return getDirections(origin, destination, attempts + 1)
  }

  // Otherwise, throw an error for the fallthrough case
  throw new Error(apiResponse.error_message)
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
