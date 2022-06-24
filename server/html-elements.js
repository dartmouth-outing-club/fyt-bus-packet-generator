import { loadFile } from './utils.js'
const EMPTY_PACKET_FP = './static/empty-packet.html'
const emptyPacket = await loadFile(EMPTY_PACKET_FP)

export function createFile (bodyHtml, title) {
  return emptyPacket + `<h1>${title}</h1>\n` + bodyHtml
}

export function createStep (step) {
  const instructions = step.instructionsHtml || '(Missing instruction)'
  const distance = step.distanceText || '(Missing distance)'
  return `<p>${instructions} - ${distance}</p>\n`
}

export function createLeg (leg) {
  if (!leg.steps) throw new Error('Leg is missing steps')
  const stepsText = leg.steps.map(createStep).join('')
  return `<section>\n<h2>${leg.startAddress}</h2>\n` + stepsText + '</section>'
}
