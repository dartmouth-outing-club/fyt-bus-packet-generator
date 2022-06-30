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

  toString = () => `<li>${this.instructions} &mdash; ${this.distance}</li>`
}

export class Leg {
  constructor (duration, distance, startAddress, steps) {
    if (!steps) throw new Error('Leg is missing steps')
    // Remove the unnecessary "USA" from the address string
    this.startAddress = startAddress.slice(0, startAddress.lastIndexOf(','))
    this.steps = steps.join('\n')
    this.duration = duration
    this.distance = distance
  }

  toString = () => `<section>
<h2>From ${this.startAddress}</h2>
<ol>
${this.steps}
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
    this.names.map(name => `<li><a href="/packet/${encodeURI(name)}">${name}</a>`).join('\n')
}
