import * as directions from '../directions-api.js'
import * as sqlite from './sqlite.js'
import { config } from '../config.js'

const GOOGLE_DIRECTIONS_API =
  'https://maps.googleapis.com/maps/api/directions/json'

export async function getDirections (origin, destination) {
  console.log(`Cache miss for directions from ${origin} to ${destination}`)
  const params = new URLSearchParams({
    ...directions.createDirectionsRequest([origin, destination]),
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
