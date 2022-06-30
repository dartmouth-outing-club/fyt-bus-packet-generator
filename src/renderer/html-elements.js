import { loadFile } from '../utils.js'

const emptyPacket = await loadFile('./src/renderer/empty-packet.html')
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
  constructor (startAddress, steps) {
    if (!steps) throw new Error('Leg is missing steps')
    // Remove the unnecessary "USA" from the address string
    this.startAddress = startAddress.slice(0, startAddress.lastIndexOf(','))
    this.steps = steps.join('\n')
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

  toString = () => this.names.map(name => `<li><a href="/packet/${encodeURI(name)}">${name}</a>`).join('\n')
}
