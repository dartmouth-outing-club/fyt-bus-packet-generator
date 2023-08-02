import { html } from '../templates.js'
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
export function buildPacket (stops, directionsList, title, date, tripsOnboard, notes) {
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
    const { duration, distance, steps: rawSteps } = directions.routes[0].legs[0]
    const currentStop = stops[index]

    // Build the next section as HTML
    const stopInfo = {
      tripsOn: tripBoardingsByStop[currentStop.name].on,
      tripsOff: tripBoardingsByStop[currentStop.name].off,
      ...currentStop
    }
    const nextStop = destination(stopInfo, duration, distance, departureTime)
    const steps = rawSteps.map(convertRawStep).join('\n')

    // Finish the loop by adding more time to the ETA
    const estimatedTripTimeMilliseconds = duration.value * 1000 // Value is in seconds
    departureTime = new Date(departureTime.getTime() + estimatedTripTimeMilliseconds + FIFTEEN_MINUTE_BREAK)
    return nextStop + steps + '\n'
  })

  // Finish up by adding the final stop to the packet
  const finalStop = stops.at(-1)
  const finalStopInfo = { tripsOn: [], tripsOff: tripBoardingsByStop[finalStop.name].off, ...finalStop }
  const finalLeg = destination(finalStopInfo)

  return packet([...legs, finalLeg], title, date, notes)
}

function packet (listItems, title, date, notes) {
  const monthDay = `${date.getMonth()}/${date.getDate()}`
  const notesMemo = notes ? html`<h3>Notes</h3><p>${notes}</p>` : ''

  return `${emptyPacket}
<title>${title}</title>
<style>
${packetStylets}</style>

<header>
<h1>${title}</h1>
<span>${monthDay}</span>
</header>
${notesMemo}
<ol>
${listItems.join()}
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

function destination (stopInfo, duration, distance, departureTime) {
  const { name, tripsOn, tripsOff, special_instructions } = stopInfo
  const instructions = special_instructions ? `<p>${special_instructions}` : ''
  const minutes = departureTime?.getUTCMinutes()
  const nextDesinationText = duration && distance
    ? `<p>
<b>${distance.text}</b> to next destination (<b>${duration.text}</b>).
You should be leaving by <b>${departureTime.getUTCHours()}:${minutes < 10 ? 0 : ''}${minutes}</b>.`
    : ''
  const tripsOnList = tripsOn?.length > 0 ? `<h3>Picking up</h3>\n${tripsList(tripsOn)}\n` : ''
  const tripsOffList = tripsOff?.length > 0 ? `<h3>Dropping off</h3>\n${tripsList(tripsOff)}\n` : ''

  const info = [instructions, nextDesinationText, tripsOnList, tripsOffList]
    .filter(item => item) // Filter out all the falsy values
    .join('\n')

  const addressText = stopInfo.address ? ` -- ${getShortAddress(stopInfo.address)}` : ''
  return `<li>
<h2>${name}${addressText} (${stopInfo.coordinates})</h2>
${info}`
}

// Not-especially-efficient function to get the first two fields of an address
// "6 N Main St, Hanover, NH 03755, USA" becomes "6 N Main St, Hanover"
function getShortAddress (address) {
  return address.split(',').slice(0, 2).join(', ')
}

const FIFTEEN_MINUTE_BREAK = 900000 // 15 minutes in milliseconds
