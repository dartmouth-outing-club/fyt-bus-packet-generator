import * as sqlite from '../clients/sqlite.js'
import * as builder from '../packets/packet-builder.js'
import * as responses from '../responses.js'

export async function get (req, res) {
  const legs = sqlite
    .getAllLegs()
    .sort((a, b) => a.start_name.localeCompare(b.start_name))

  const render = legs.map((leg) => {
    const { start_name, end_name, directions } = leg
    const { duration, distance, steps: rawSteps } = directions?.routes.at(0)?.legs.at(0)

    const steps = rawSteps.map((step) => {
      const instructionsHtml = step.html_instructions
      const distanceText = step.distance?.text
      return builder.step(instructionsHtml, distanceText)
    }).join('\n')

    return directionsList(start_name, end_name, steps, duration, distance)
  }).join('')

  responses.serveHtml(req, res, render)
}

/** Rendering Functions **/
function directionsList (startName, endName, steps, _duration, _distance) {
  // We can't template this right now because its populated with Google-generated html
  // TODO more investigation in this area
  return `
<li onclick="this.classList.toggle('expanded')">
<button>${startName} to ${endName}</button>
<ol>
${steps}
</ol>
`
}
