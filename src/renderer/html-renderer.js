import { loadFile } from '../utils.js'

// Note that imports are relative to current file, but non-import FPs are relative to source root
const emptyPacket = await loadFile('./src/renderer/packet-base.html')
const packetStylets = await loadFile('./src/renderer/packet-stylesheet.css')


export class Packet {
  constructor (legs, title) {
    this.bodyHtml = legs.map(leg => leg.toString()).join('\n')
    this.title = title
  }

  toString = () => `${emptyPacket}
<title>${this.title}</title>
<style>
${packetStylets}</style>

<h1>${this.title}</h1>
${this.bodyHtml}`
}

export class Step {
  constructor (instructionsHtml, distanceText) {
    this.instructions = instructionsHtml || '(Missing instruction)'
    this.distance = distanceText || '(Missing distance)'
  }

  toString = () => `<li>${this.instructions} &mdash; ${this.distance}`
}

export class Leg {
  constructor (duration, distance, startName, endName, steps, instructions) {
    if (!steps) throw new Error('Leg is missing steps')
    // Remove the unnecessary "USA" from the address string
    this.startName = startName
    this.endName = endName
    this.steps = steps.join('\n')
    this.duration = duration
    this.distance = distance
    this.instructions = instructions
  }

  toString = () => `<section>
<h2>From ${this.startName}</h2>
<ol>
${this.steps}
<li>
  <h2>Arrived at ${this.endName}</h2>
  <p>${this.instructions}
</ol>
</section>
`
}

export class StopsOptionList {
  constructor (stops) {
    this.stops = stops
  }

  toString = () => this.stops.map(stop => `<option>${stop}`).join('\n')
}

export class PacketLinkList {
  constructor (names) {
    this.names = names
  }

  toString = () =>
    this.names
      .map(name => `<li>
  <a href="/packet/${encodeURI(name)}">${name}</a>
  <button onclick="deletePacket('${name}')">Delete</button>`)
      .join('\n')
}
