import { getDirections } from './clients/google-client.js'

const HANOVER_COORDINATES = '44.875039,-71.05471'
const LODJ_COORDINATES = '43.977253,-71.8154831'
const ANDROSCOGGIN_COORDINATES = '44.714042,-71.173832'

const directions = await getDirections([
  HANOVER_COORDINATES,
  LODJ_COORDINATES,
  ANDROSCOGGIN_COORDINATES
])

console.log(JSON.stringify(directions))
