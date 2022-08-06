import * as utils from '../utils.js'

// Note: imports are relative to current file, but non-import FPs are relative to source root
const emptyPacket = await utils.loadFile('./src/renderer/packet-base.html')
const packetStylets = await utils.loadFile('./src/renderer/packet-stylesheet.css')

// Technically there is an opportunity for XSS here
// We don't have any cookies to be stolen with XSS, but it's worth fixing
export function packet (listItems, title, date) {
  const monthDay = date.slice(5).replace('-', '/')

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

export function destination (name, tripsOn, tripsOff, instructions, duration, distance) {
  const specialInstructions = instructions ? `<p>${instructions}` : null
  const nextDesinationText = duration && distance
    ? `<p><b>${distance.text}</b> to next destination (<b>${duration.text}</b>)`
    : null
  const tripsOnList = tripsOn.length > 0 ? `<h3>Picking up</h3>\n${tripsList(tripsOn)}` : null
  const tripsOffList = tripsOff.length > 0 ? `<h3>Dropping off</h3>\n${tripsList(tripsOff)}` : null

  const info = [specialInstructions, nextDesinationText, tripsOnList, tripsOffList]
    .filter(item => item) // Filter out all the falsy values
    .join('\n')

  return `
<li>
<h2>${name}</h2>
${info}
`
}

export function stopsOptionList (stops) {
  return stops.map(stop => `<option>${stop}`).join('\n')
}

export function packetLinkList (names) {
  return names.map(name => `<li>
<button class=edit onclick="editPacket('${name}')">Edit</button>
<button class=delete onclick="deletePacket('${name}')">Delete</button>
<a href="/api/packets/${encodeURI(name)}">${name}</a>
`).join('')
}

export function tripsTable (trips) {
  trips.sort((a, b) => utils.tripSort(a.name, b.name))
  const tripsHtml = trips.map((trip) => `<tr>
<td>${trip.name}
<td>${trip.num_students}
`).join('')

  return `<table>
<tr>
<th>Trip Name
<th>Num Students
${tripsHtml}
</table>
`
}

export function tripsOptions (trips) {
  trips.sort((a, b) => utils.tripSort(a.name, b.name))
  return trips.map((trip) => `<option>${trip.name}</option>`).join('\n')
}

export function errorMessage (message) {
return `<div class=error onclick="this.remove()">
<p>${message}
</div>
`
}

export function successMessage (message) {
return `<div class=success onclick="this.remove()">
<p>${message}
</div>
`
}
