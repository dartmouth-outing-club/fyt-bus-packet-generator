import * as utils from '../utils.js'

// Note: imports are relative to current file, but non-import FPs are relative to source root
const emptyPacket = await utils.loadFile('./src/renderer/packet-base.html')
const packetStylets = await utils.loadFile('./src/renderer/packet-stylesheet.css')

// Technically there is an opportunity for XSS here
// We don't have any cookies to be stolen with XSS, but it's worth fixing
export function packet (listItems, title, date) {
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

export function destination (name, tripsOn, tripsOff, instructions, duration, distance, departureTime) {
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

export function packetLinkList (names) {
  const items = names.map(name => `<li>
<button class=edit onclick="editPacket('${name}')">Edit</button>
<button class=delete onclick="deletePacket('${name}')">Delete</button>
<a href="/api/packets/${encodeURI(name)}">${name}</a>`).join('\n')

  return `<ul>
${items}
</ul>`
}

export function packetsTable (packets) {
  const packetsTable = packets.map((packet) => `<tr>
<td>${packet.name}
<td>${packet.total_students}`).join('\n')

  return `<table>
<tr>
<th>Packet
<th>Total Students
${packetsTable}
</table>`
}

export function generationError (list) {
  return `<div class=error onclick="this.remove()">
<p>Something went wrong; the following packages failed to regenerate:
<ul>
${list.map(item => `<li>${item}`)}
</ul>
<p>Please edit the packets with errors ensure that the trips selected are still valid.
</div>
`
}
