import { Leg, Packet, Step } from './renderer/html-renderer.js'

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

function convertRawStep (rawStep) {
  const instructionsHtml = rawStep.html_instructions
  const distanceText = rawStep.distance?.text
  return new Step(instructionsHtml, distanceText)
}

/**
 * Create a list of Legs from the raw JSON of the directions response.
 */
export function getPacketFromResponse (response) {
  const legs = response?.routes.at(0)?.legs.map((leg) => {
    // const distanceText = leg.distance?.text
    const startAddress = leg.start_address
    const steps = leg.steps.map(convertRawStep)
    return new Leg(startAddress, steps)
  })

  return new Packet(legs, 'Trip to Hanover')
}
