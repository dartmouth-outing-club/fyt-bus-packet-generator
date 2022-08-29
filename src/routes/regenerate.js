import * as responses from '../responses.js'
import * as sqlite from '../clients/sqlite.js'
import { generatePacket } from './packets.js'
import { html } from '../templates.js'

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
export async function post (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const name = decodeURI(requestUrl.pathname).split('/').at(3)
  const packets = name ? [sqlite.getPacket(name)] : sqlite.getAllPackets()
  console.log(`Regenerating ${packets.length} packets`)

  const promises = packets.map(packet => generatePacket(packet.query))
  const results = await Promise.allSettled(promises)
  const failedPromises = results.filter(result => result.status === 'rejected')

  if (failedPromises.length === 0) {
    console.log('Successfully regenerated all packets.')
    responses.serveSuccessMessage(req, res, 'Successfully regenerated all packets.')
  } else {
    const failedPacketNames = failedPromises.map((result, index) => {
      console.error(`(#${index}) failed:`, result)
      return packets[index].name
    })
    responses.serveHtml(req, res, generationError(failedPacketNames))
  }
}

function generationError (list) {
  const items = list.map(item => html`<li>${item}`)
  return html`<div class=error onclick="this.remove()">
<p>Something went wrong; the following packages failed to regenerate:
<ul>
${items}
</ul>
<p>Please edit the packets with errors ensure that the trips selected are still valid.
</div>
`
}
