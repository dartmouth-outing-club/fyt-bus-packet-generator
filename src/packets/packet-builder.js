import * as utils from '../utils.js'

// Note: imports are relative to current file, but non-import FPs are relative to source root
const emptyPacket = await utils.loadFile('./src/packets/packet-base.html')
const packetStylets = await utils.loadFile('./src/packets/packet-stylesheet.css')

export function convertRawStep (rawStep) {
  const instructionsHtml = rawStep.html_instructions
  const distanceText = rawStep.distance?.text
  return step(instructionsHtml, distanceText)
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
    const nextStop = destination(start.name, tripsOn, tripsOff, start.specialInstructions, duration, distance, departureTime)
    const steps = rawSteps.map(convertRawStep).join('\n')

    // Finish the loop by adding more time to the ETA
    const estimatedTripTimeMilliseconds = duration.value * 1000 // Value is in seconds
    departureTime = new Date(departureTime.getTime() + estimatedTripTimeMilliseconds + FIFTEEN_MINUTE_BREAK)
    return nextStop + steps + '\n'
  })

  const finalStop = stops.at(-1)
  const finalLeg = destination(finalStop.name, [], tripBoardingsByStop[finalStop.name].off, finalStop.specialInstructions)

  return packet([...legs, finalLeg], title, date)
}

// Technically there is an opportunity for XSS here
// We don't have any cookies to be stolen with XSS, but it's worth fixing
function packet (listItems, title, date) {
  const monthDay = `${date.getMonth()}/${date.getDate()}`

  return `${emptyPacket}
<title>${title}</title>
<style>
${packetStylets}</style>

<header>
<h1>${title}</h1>
<span>${monthDay}</span>
</header>

<ol>
${listItems.join('\n')}
</ol>
`
}

export function step (instructionsHtml, distanceText) {
  const instructions = instructionsHtml || '(Missing instruction)'
  const distance = distanceText || '(Missing distance)'

  return `<li>${instructions} &mdash; ${distance}`
}

function tripsList (trips) {
  const items = trips.map(trip => `<li><b>${trip.name}</b> (${trip.num_students || 'Unknown # of'} people)`)
  return trips.length > 0 ? `<ul>\n${items.join('\n')}\n</ul>` : ''
}

function destination (name, tripsOn, tripsOff, instructions, duration, distance, departureTime) {
  const specialInstructions = instructions ? `<p>${instructions}` : ''
  const minutes = departureTime?.getUTCMinutes()
  const nextDesinationText = duration && distance
    ? `<p>
<b>${distance.text}</b> to next destination (<b>${duration.text}</b>).
You should be leaving by <b>${departureTime.getUTCHours()}:${minutes < 10 ? 0 : ''}${minutes}</b>.`
    : ''
  const tripsOnList = tripsOn.length > 0 ? `<h3>Picking up</h3>\n${tripsList(tripsOn)}\n` : ''
  const tripsOffList = tripsOff.length > 0 ? `<h3>Dropping off</h3>\n${tripsList(tripsOff)}\n` : ''

  const info = [specialInstructions, nextDesinationText, tripsOnList, tripsOffList]
    .filter(item => item) // Filter out all the falsy values
    .join('\n')

  return `<li>
<h2>${name}</h2>
${info}`
}

const FIFTEEN_MINUTE_BREAK = 900000 // 15 minutes in milliseconds
