import * as directions from '../directions-api.js'
import { config } from '../config.js'

const GOOGLE_DIRECTIONS_API =
  'https://maps.googleapis.com/maps/api/directions/json'

export async function getDirections (coordinateList) {
  const params = new URLSearchParams({
    ...directions.createDirectionsRequest(coordinateList),
    key: config.GOOGLE_API_KEY
  })
  const request = `${GOOGLE_DIRECTIONS_API}?${params}`

  console.log(`Fetching ${request}...`)
  return fetch(request).then((res) => res.json())
}
