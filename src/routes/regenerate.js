import * as responses from '../responses.js'
import * as html from '../renderer/html-renderer.js'
import * as sqlite from '../clients/sqlite.js'
import { generatePacket } from './packets.js'

const ERROR_MESSAGE = `Something went wrong regenerating the packets.
Contact server administrator for more details.`

/** Regenerate existing packets using stored info.
 *
 * In the database we save both the packet and the original query used to
 * create it. So all this function does is take the original query, and
 * recreate the HTML. That will create the packet with the most up-to-date info
 * about trips and stops. This is handy if, say, the special instructions or
 * coordinates of a stop have changed since the packet was created.
 *
 * Because the google directions API calls are cached, we don't need to worry
 * that this will explode our API limit, though it should be noted that the
 * google API will get called be a regeneration if the coordinates of a stop
 * have changed.
 *
 * This operation should potentially go in a worker thread on the off chance
 * that regenerating thousands of these would block the event loop. At the
 * levels we're likely to see here however, I do not anticipate it being much
 * of an issue.
 */
export async function post (_req, res) {
  const packets = sqlite.getAllPackets()
  console.log(`Regenerating ${packets.length} packets`)

  try {
    const promises = packets.map(packet => generatePacket(packet.query))
    await Promise.all(promises)
    responses.serveAsString(res, html.successMessage(`Successfully regenerated ${packets.length} packet(s)`))
  } catch (error) {
    console.error('Something went wrong regenerating the packets.\n', error)
    responses.serveAsString(res, html.errorMessage(ERROR_MESSAGE))
  }
}
