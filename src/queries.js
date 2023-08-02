/**
 * Extract all the stops from a URLSearchParams, and return their values in the stop order.
 *
 * For instance, say we have query keys: "stop1-location", "stop3-location", and "stop2-location"
 * with values: "Moosilauke", "White River",  "Hanover", in that order.
 * This function returns ['Moosilauke', 'Hanover', 'White River'] since that is that is the
 * numerical order of the stops.
 *
 */
function parseStopList (params) {
  const keys = Array.from(params.keys())
  return keys.filter(key => key.startsWith('stop'))
    .map(key => key.slice(4, key.indexOf('-')))
    .map(num => parseInt(num))
    .sort()
    .map(num => `stop${num}-location`)
    .map(key => params.get(key))
}

function parseTripBoardings (params) {
  const keys = Array.from(params.keys())
  const tripNames = keys
    .filter(key => key.match(/trip-([^-]*)-st/))
    .map(key => key.match(/trip-([^-]*)-st/)[1])

  // Create an object of trips, where each trip is an object with a start and end property
  return tripNames.map(trip => {
    const start = params.get(`trip-${trip}-start`)
    const end = params.get(`trip-${trip}-end`)
    return { name: trip.toUpperCase(), start, end }
  })
}

/**
 * Make a list of all the edges present in a flat list.
 *
 * For instance: a list l [1,2,3] would become [[1,2], [2,3]]
 * Note that the resulting list contains the references to the items in the original list if they're
 * not primitives. In other words, objects are shallow copies.
 */
export function makeEdgeList (list) {
  const edges = []
  for (let i = 0; i < list.length - 1; i++) {
    const leg = list.slice(i, i + 2)
    edges.push(leg)
  }

  return edges
}

export function parseQuery (body) {
  const params = new URLSearchParams(body)

  const name = params.get('route-name')
  const date = params.get('route-date')
  const time = params.get('route-time') || '08:00'
  const origin = params.get('origin-location')
  const destination = params.get('destination-location')
  const notes = params.get('notes')

  const stops = parseStopList(params)
  const tripsOnboard = parseTripBoardings(params)
  const datetime = new Date(`${date} ${time} UTC`)

  if (!origin || !destination) throw new Error(`Bad request, stops = ${stops}`)

  const stopNames = [origin, ...stops, destination]
  return { name, date: datetime, stopNames, tripsOnboard, notes }
}
