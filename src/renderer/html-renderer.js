import { loadFile } from '../utils.js'

// Note: imports are relative to current file, but non-import FPs are relative to source root
const emptyPacket = await loadFile('./src/renderer/packet-base.html')
const packetStylets = await loadFile('./src/renderer/packet-stylesheet.css')
const trashCanSvg = await loadFile('./static/trash-can.svg')

// Technically there is an opportunity for XSS here
// We don't have any cookies to be stolen with XSS, but it's worth fixing nonetheless
export function packet (legs, title, date) {
  const mainHtml = legs.map(leg => leg.toString()).join('\n')
  const monthDay = date.slice(5).replace('-', '/')

  return `${emptyPacket}
<title>${title}</title>
<style>
${packetStylets}</style>

<header>
<h1>${title}</h1>
<span>${monthDay}</span>
</header>

${mainHtml}`
}

export function step (instructionsHtml, distanceText) {
  const instructions = instructionsHtml || '(Missing instruction)'
  const distance = distanceText || '(Missing distance)'

  return `<li>${instructions} &mdash; ${distance}`
}

export function leg (duration, distance, startName, endName, steps, instructions) {
  if (!steps) throw new Error('Leg is missing steps')

  return `<section>
<header>
<h2>From ${startName}</h2>
<p><b>${distance.text}</b> to next destination (<b>${duration.text}</b>)
</header>

<ol>
${steps.join('\n')}
<li>
  <h2>Arrived at ${endName}</h2>
  <p>${instructions || ''}
</ol>
</section>
`
}

export function stopsOptionList (stops) {
  return stops.map(stop => `<option>${stop}`).join('\n')
}

export function packetLinkList (names) {
  return names.map(name => `<li>
  <button class=edit onclick="editPacket('${name}')">Edit</button>
  <button class=delete onclick="deletePacket('${name}')">Delete</button>
  <a href="/api/packet/${encodeURI(name)}">${name}</a>
  `).join('')
}
