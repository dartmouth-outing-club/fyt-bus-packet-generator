import * as sqlite from '../clients/sqlite.js'
import * as html from '../renderer/html-renderer.js'
import * as responses from '../responses.js'

export async function get (_req, res) {
  const legs = sqlite
    .getAllLegs()
    .sort((a, b) => a.start_name.localeCompare(b.start_name))

  const render = legs.map((leg) => {
    const { start_name, end_name, directions } = leg
    const { duration, distance, steps: rawSteps } = directions?.routes.at(0)?.legs.at(0)

    const steps = rawSteps.map((step) => {
      const instructionsHtml = step.html_instructions
      const distanceText = step.distance?.text
      return html.step(instructionsHtml, distanceText)
    })

    return html.directionsList(start_name, end_name, steps, duration, distance)
  }).join('')

  responses.serveAsString(res, render)
}
