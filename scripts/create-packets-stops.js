/**
 * create-packets-stops.js
 *
 * I used this script to generate to populate the packets_stops table.
 * A fresh start to the program wouldn't require this; it is preserved for
 * historical and educational purposes.
 */
import * as sqlite from '../src/clients/sqlite.js'
import * as queries from '../src/queries.js'

const packets = sqlite.getAllPackets()
const values = packets
  .map(packet => queries.parseQuery(packet.query))
  .flatMap(packet => (
    packet.stopNames.map(stop => (
      `('${packet.name}', '${stop}')`)
    )
  ))
  .join(',\n')

console.log(
`CREATE TABLE packets_stops (
  packet TEXT REFERENCES packets ON DELETE CASCADE ON UPDATE CASCADE,
  stop TEXT REFERENCES stops ON DELETE RESTRICT ON UPDATE CASCADE
);
`)
console.log(`INSERT INTO packets_stops (packet, stop) VALUES\n${values};`)
