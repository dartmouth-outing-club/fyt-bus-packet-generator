import * as directions from '../directions-api.js'
import * as sqlite from './sqlite.js'
import { config } from '../config.js'

const GOOGLE_DIRECTIONS_API =
  'https://maps.googleapis.com/maps/api/directions/json'

export async function getDirections (coordinateList) {
  const params = new URLSearchParams({
    ...directions.createDirectionsRequest(coordinateList),
    key: config.GOOGLE_API_KEY
  })
  const request = `${GOOGLE_DIRECTIONS_API}?${params}`

  console.log('Fetching directions from Google')
  return fetch(request)
    .then((res) => res.text())
    .then((text) => {
      sqlite.saveDirections(coordinateList[0], coordinateList.at(-1), text)
      return JSON.parse(text)
    })
}
