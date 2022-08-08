import * as sqlite from '../clients/sqlite.js'
import * as html from '../renderer/html-renderer.js'
import * as responses from '../responses.js'
import { convertRawStep } from '../directions-api.js'

export async function get (req, res) {

  const legs = sqlite.getAllLegs()
  const render = legs.map((leg) => {
    const { start_name, end_name, directions } = leg
    const { duration, distance, steps: rawSteps } = directions?.routes.at(0)?.legs.at(0)
    const steps = rawSteps.map(convertRawStep).join('\n')
    return html.leg(start_name, end_name, steps, duration, distance)
  }).join('')

  responses.serveAsString(res, render)
}
