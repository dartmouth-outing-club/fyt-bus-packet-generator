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
 */
export function buildPacket (stops, directionsList, title, date, tripsOnboard) {
  const tripBoardingsByStop = stops.reduce((boardings, stop) => {
    boardings[stop.name] = { on: [], off: [] }
    return boardings
  }, {})
  tripsOnboard.forEach((trip) => {
    const { name, num_students, start, end } = trip
    tripBoardingsByStop[start].on.push({ name, num_students })
    tripBoardingsByStop[end].off.push({ name, num_students })
  })

  let departureTime = new Date(date.getTime())
  const legs = directionsList.map((directions, index) => {
    const { duration, distance, steps: rawSteps } = directions?.routes.at(0)?.legs.at(0)
    const start = stops[index]
    const tripsOn = tripBoardingsByStop[start.name].on
    const tripsOff = tripBoardingsByStop[start.name].off

    // Build the next section as HTML
    const nextStop = html.destination(start.name, tripsOn, tripsOff, start.specialInstructions, duration, distance, departureTime)
    const steps = rawSteps.map(convertRawStep).join('\n')

    // Finish the loop by adding more time to the ETA
    const estimatedTripTimeMilliseconds = duration.value * 1000 // Value is in seconds
    departureTime = new Date(departureTime.getTime() + estimatedTripTimeMilliseconds + FIFTEEN_MINUTE_BREAK)
    return nextStop + steps + '\n'
  })

  const destination = stops.at(-1)
  const finalStop = html.destination(destination.name, [], tripBoardingsByStop[destination.name].off, destination.specialInstructions)

  return html.packet([...legs, finalStop], title, date)
}

const FIFTEEN_MINUTE_BREAK = 900000 // 15 minutes in milliseconds
