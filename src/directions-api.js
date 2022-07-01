import * as html from './renderer/html-renderer.js'

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

export function convertRawStep (rawStep) {
  const instructionsHtml = rawStep.html_instructions
  const distanceText = rawStep.distance?.text
  return html.step(instructionsHtml, distanceText)
}

/**
 * Create a list of Legs from the raw JSON of the directions response.
 *
 * Only builds a single leg right now.
 */
export function buildPacket (directions, tripName, startName, endName, instructions) {
  const { duration, distance, steps: rawSteps } = directions?.routes.at(0)?.legs.at(0)
  const steps = rawSteps.map(convertRawStep)
  const leg = html.leg(duration, distance, startName, endName, steps, instructions)

  return html.packet([leg], tripName)
}
